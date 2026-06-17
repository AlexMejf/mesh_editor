import React, {
  useRef, useState, useCallback, useEffect, useMemo,
} from "react";
import { MeshContext } from "../core/MeshContext";
import { createEditorAPI } from "../core/createEditorAPI";
import { corePlugins } from "../plugins/default";
import { SurfaceStyles } from "./SurfaceStyles";

// Bloques "atomicos" que atrapan el cursor si quedan al final del documento.
// Se detectan por tag HTML o por el atributo de convencion data-mesh-atomic.
const ATOMIC_TAGS = ["TABLE", "FIGURE", "IMG", "HR"];
function isAtomic(node) {
  return (
    node.nodeType === 1 &&
    (ATOMIC_TAGS.includes(node.tagName) || node.hasAttribute("data-mesh-atomic"))
  );
}
// Garantiza un parrafo de escape al final: si lo ultimo es un bloque atomico,
// añade un <p> vacio para que el usuario nunca quede atrapado.
function ensureTrailingParagraph(el) {
  if (!el || el.children.length === 0) return;
  const last = el.lastElementChild;
  if (last && isAtomic(last)) {
    const p = document.createElement("p");
    p.appendChild(document.createElement("br"));
    el.appendChild(p);
  }
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
    ensureTrailingParagraph(el); // siempre deja un parrafo de escape al final
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

  // Contenido inicial (una sola vez, no controlado).
  useEffect(() => {
    if (elRef.current && value) {
      elRef.current.innerHTML = value;
      ensureTrailingParagraph(elRef.current);
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
    [plugins, editor, bumpSelection]
  );

  const isPreview = view === "preview";
  const ctx = { editor, plugins, pluginMap, view, setView: changeView };

  return (
    <MeshContext.Provider value={ctx}>
      <div className={"rounded-2xl border border-slate-200 bg-white shadow-sm " + className}>
        {children}
        <div className="relative">
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