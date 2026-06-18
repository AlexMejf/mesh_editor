import React, {
  useRef, useState, useCallback, useEffect, useMemo,
} from "react";
import { MeshContext } from "../core/MeshContext";
import { createEditorAPI } from "../core/createEditorAPI";
import { corePlugins } from "../plugins/default";
import { SurfaceStyles } from "./SurfaceStyles";

// Selector de bloques "atomicos" que atrapan el cursor: tags que lo hacen de
// por si + el atributo de convencion data-mesh-atomic.
const ATOMIC_SELECTOR = "table, figure, hr, [data-mesh-atomic]";

// Garantiza un <p> de escape DESPUES de cada bloque atomico que no tenga ya un
// hermano editable (cubre el final del documento y el hueco entre dos atomicos
// pegados). El escape de INICIO no se crea aqui: seria una linea vacia
// permanente. Se crea bajo demanda con la flecha arriba (ver onKeyDown).
function ensureEscapes(el) {
  if (!el) return;
  el.querySelectorAll(ATOMIC_SELECTOR).forEach((atomic) => {
    // Si ya le pusimos escape o ya tiene contenido después, ignorar
    if (atomic.dataset.meshEscaped) return;

    const parentAtomic = atomic.parentElement?.closest(ATOMIC_SELECTOR);
    if (parentAtomic && atomic.tagName === "IMG" && parentAtomic.tagName === "FIGURE") {
      return;
    }

    const next = atomic.nextElementSibling;
    if (!next || next.matches(ATOMIC_SELECTOR)) {
      const p = document.createElement("p");
      p.appendChild(document.createElement("br"));
      atomic.after(p);
      // Marcamos que este bloque ya generó su escape inicial
      atomic.dataset.meshEscaped = "true";
    }
  });
}

/**
 * <MeshEditor> — provider + superficie editable.
 *
 * Props:
 *   plugins      array de plugins disponibles (default: corePlugins)
 *   value        HTML inicial (NO controlado, para no romper el cursor)
 *   onChange     (html) => void
 *   placeholder  texto fantasma
 *   className    clases extra para el contenedor
 *
 * Expone en el contexto `view` ('edit' | 'preview') y `setView`.
 * IMPORTANTE: en preview el editable NO se desmonta, solo se oculta. Asi
 * `editor.getElement()` nunca es null y los plugins que leen el DOM no truenan.
 */
export function MeshEditor({
  plugins = corePlugins,
  value = "",
  onChange,
  placeholder = "Escribe algo...",
  children,
  className = "",
}) {
  const elRef = useRef(null);
  const htmlRef = useRef(value); // ultimo HTML, para alimentar el preview

  const [view, setView] = useState("edit"); // "edit" | "preview"

  // selTick fuerza re-render de la barra cuando cambia la seleccion, SIN
  // tocar el innerHTML del editable (eso resetearia el cursor).
  const [, setSelTick] = useState(0);
  const bumpSelection = useCallback(() => setSelTick((n) => n + 1), []);
  const [isEmpty, setIsEmpty] = useState(!value);

  const notifyChange = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    ensureEscapes(el); // siempre deja un parrafo de escape tras los bloques atomicos
    htmlRef.current = el.innerHTML;
    setIsEmpty(el.textContent.trim() === "");
    onChange?.(el.innerHTML);
  }, [onChange]);

  const editor = useMemo(
    () => createEditorAPI(() => elRef.current, notifyChange, bumpSelection),
    [notifyChange, bumpSelection]
  );

  // Al entrar a preview, captura el HTML actual para mostrarlo.
  const changeView = useCallback((v) => {
    if (v === "preview" && elRef.current) {
      htmlRef.current = elRef.current.innerHTML;
    }
    setView(v);
  }, []);

  // Mapa nombre -> plugin, para que ControlsEditor resuelva por nombre.
  const pluginMap = useMemo(() => {
    const m = new Map();
    plugins.forEach((p) => m.set(p.name, p));
    return m;
  }, [plugins]);

  // Contenido inicial (una sola vez, no controlado) + separador de parrafo.
  useEffect(() => {
    // Que los saltos de linea sean <p> en vez de <div> (mas limpio y predecible).
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (_) {}
    if (elRef.current && value) {
      elRef.current.innerHTML = value;
      ensureEscapes(elRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualiza estado de botones al mover la seleccion.
  useEffect(() => {
    document.addEventListener("selectionchange", bumpSelection);
    return () => document.removeEventListener("selectionchange", bumpSelection);
  }, [bumpSelection]);

  // Atajos de teclado declarados por los plugins.
  const onKeyDown = useCallback(
    (e) => {
      // Guard de estructura: no dejar que Backspace/Delete en una celda VACIA
      // de un bloque atomico (ej. columna de layout) colapse la estructura.
      if (e.key === "Backspace" || e.key === "Delete") {
        const sel = window.getSelection();
        if (sel && sel.rangeCount && sel.isCollapsed) {
          const node = sel.anchorNode;
          const elx = node && (node.nodeType === 3 ? node.parentElement : node);
          const cell = elx && elx.closest && elx.closest("[data-mesh-col]");
          
          if (cell) {
            // Si hay más de un hijo (varios <p>), permitimos borrar para limpiar espacio.
            if (cell.children.length > 1) return;
            
            // Si hay texto, permitimos borrar (hasta que quede la celda vacía).
            if (cell.textContent.trim() !== "") return;

            // Si llegamos aquí, la celda está en su estado mínimo (1 hijo o menos y sin texto).
            // Bloqueamos para que no se borre el <div> contenedor de la celda.
            e.preventDefault();
            return;
          }
        }
      }

      // Escape de INICIO bajo demanda: si el primer bloque del documento es
      // atomico y el cursor esta en su primera linea, ArrowUp crea un parrafo
      // arriba (en vez de tener una linea vacia permanente).
      if (e.key === "ArrowUp") {
        const el = elRef.current;
        const sel = window.getSelection();
        if (el && sel && sel.rangeCount && sel.isCollapsed) {
          let block = sel.anchorNode;
          block = block && (block.nodeType === 3 ? block.parentElement : block);
          while (block && block.parentElement && block.parentElement !== el) {
            block = block.parentElement;
          }
          const isFirstAtomic =
            block && block.parentElement === el &&
            !block.previousElementSibling &&
            block.matches(ATOMIC_SELECTOR);
          if (isFirstAtomic) {
            // solo si el cursor esta cerca del borde superior del bloque
            const cr = sel.getRangeAt(0).getBoundingClientRect();
            const br = block.getBoundingClientRect();
            if (!cr.height || cr.top - br.top < 28) {
              e.preventDefault();
              const p = document.createElement("p");
              p.appendChild(document.createElement("br"));
              block.before(p);
              const r = document.createRange();
              r.setStart(p, 0); r.collapse(true);
              sel.removeAllRanges(); sel.addRange(r);
              notifyChange();
              return;
            }
          }
        }
      }

      const mod = e.metaKey || e.ctrlKey;
      for (const p of plugins) {
        if (!p.shortcut) continue;
        const parts = p.shortcut.split("+");
        const wantMod = parts.includes("mod");
        const wantShift = parts.includes("shift");
        const key = parts[parts.length - 1];
        if (wantMod === mod && wantShift === e.shiftKey &&
            e.key.toLowerCase() === key) {
          e.preventDefault();
          p.execute?.(editor);
          bumpSelection();
          return;
        }
      }
    },
    [plugins, editor, bumpSelection, notifyChange]
  );

  const isPreview = view === "preview";
  const ctx = { editor, plugins, pluginMap, view, setView: changeView };

  return (
    <MeshContext.Provider value={ctx}>
      <div
        className={
          "flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm " +
          className
        }
        style={{ height: className.includes("h-") ? "100%" : "auto" }}
      >
        {children}
        <div 
          className="mesh-board relative flex-1 overflow-y-auto"
          style={{ maxHeight: className.includes("h-") ? "none" : "70vh" }}
        >
          {/* Editable SIEMPRE montado; solo se oculta en preview. */}
          <div
            ref={elRef}
            contentEditable
            suppressContentEditableWarning
            onInput={notifyChange}
            onKeyUp={bumpSelection}
            onMouseUp={bumpSelection}
            onKeyDown={onKeyDown}
            spellCheck
            className={
              "mesh-surface min-h-[280px] px-6 py-5 outline-none text-slate-800 leading-relaxed " +
              (isPreview ? "hidden" : "")
            }
          />

          {/* Placeholder solo en edicion y cuando esta vacio. */}
          {!isPreview && isEmpty && (
            <div className="pointer-events-none absolute left-6 top-5 text-slate-400 select-none">
              {placeholder}
            </div>
          )}

          {/* Vista previa: HTML renderizado, no editable, sin chrome. */}
          {isPreview && (
            <div
              className="mesh-surface min-h-[280px] px-6 py-5 text-slate-800 leading-relaxed"
              dangerouslySetInnerHTML={{
                __html: htmlRef.current || "<p style='color:#94a3b8'>(documento vacío)</p>",
              }}
            />
          )}
        </div>
      </div>
      <SurfaceStyles />
    </MeshContext.Provider>
  );
}