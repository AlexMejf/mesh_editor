// src/plugins/community/layout.js
import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Columns3, Trash2, GripVertical, ArrowUp, ArrowDown, LayoutTemplate } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

// Presets de layout: cada uno define las fracciones de las columnas.
const PRESETS = [
  { id: "col-1",     label: "1 columna",        cols: [1] },
  { id: "col-2",     label: "2 columnas",       cols: [1, 1] },
  { id: "col-3",     label: "3 columnas",       cols: [1, 1, 1] },
  { id: "col-4",     label: "4 columnas",       cols: [1, 1, 1, 1] },
  { id: "col-1-2",   label: "1 : 2 (sidebar)",  cols: [1, 2] },
  { id: "col-2-1",   label: "2 : 1 (sidebar)",  cols: [2, 1] },
  { id: "col-1-2-1", label: "1 : 2 : 1",        cols: [1, 2, 1] },
];

function buildLayoutHTML(cols) {
  const tracks = cols.map((c) => `${c}fr`).join(" ");
  const cells = cols
    .map(
      () =>
        `<div data-mesh-col="true" style="min-width:0;padding:10px;border:1px dashed #9a9da1;border-radius:8px"><p><br></p></div>`
    )
    .join("");
  return (
    `<div data-mesh-layout="true" data-mesh-atomic="true" ` +
    `style="display:grid;grid-template-columns:${tracks};gap:12px;margin:8px 0">` +
    `${cells}</div>`
  );
}

// Hook: resuelve editor.getElement() de forma reactiva. En el primer render el
// ref aún no está asignado (devuelve null), así que reintenta hasta tenerlo.
function useEditorRoot(editor) {
  const [root, setRoot] = useState(() => editor.getElement());
  useEffect(() => {
    if (root) return;
    let raf;
    const tick = () => {
      const el = editor.getElement();
      if (el) setRoot(el);
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [editor, root]);
  return root;
}

// ---------- Dropdown de inserción ----------
function LayoutControl({ editor }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onDown(ev) {
      if (boxRef.current && !boxRef.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // El botón NO depende de root: se renderiza siempre. root se resuelve aquí,
  // en el momento del clic, cuando ya existe con seguridad.
  function handleButton() {
    const r = editor.getElement();
    if (!r) return;
    const sel = window.getSelection();
    r.__msLayoutRange =
      sel && sel.rangeCount && r.contains(sel.getRangeAt(0).commonAncestorContainer)
        ? sel.getRangeAt(0).cloneRange()
        : null;
    setOpen((o) => !o);
  }

  function insert(cols) {
    const r = editor.getElement();
    const saved = r && r.__msLayoutRange;
    editor.focus();
    if (saved) {
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(saved);
    }
    editor.exec("insertHTML", buildLayoutHTML(cols));
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button"
        title="Layout en columnas"
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleButton}
        className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-200/70"
      >
        <LayoutTemplate size={17} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => insert(p.cols)}
              className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm text-slate-700 hover:bg-slate-100"
            >
              <span
                className="flex h-4 w-9 shrink-0 gap-0.5 rounded border border-slate-300 p-0.5"
                aria-hidden
              >
                {p.cols.map((c, i) => (
                  <span
                    key={i}
                    style={{ flexGrow: c }}
                    className="rounded-sm bg-violet-500/70"
                  />
                ))}
              </span>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ---------- Overlay de selección (mover / eliminar) ----------
function LayoutOverlay({ editor }) {
  const root = useEditorRoot(editor); // reactivo: null al inicio, luego el nodo
  const [target, setTarget] = useState(null);
  const [rect, setRect] = useState(null);
  const overlayRef = useRef(null);

  const findLayout = useCallback(
    (node) => {
      if (!root) return null;
      while (node && node !== root) {
        if (node.nodeType === 1 && node.getAttribute?.("data-mesh-layout")) return node;
        node = node.parentNode;
      }
      return null;
    },
    [root]
  );

  // Reposiciona el overlay relativo al root. Relee getBoundingClientRect fresco.
  const reposition = useCallback(() => {
    if (!target || !root || !root.contains(target)) {
      setRect(null);
      return;
    }
    const tr = target.getBoundingClientRect();
    const rr = root.getBoundingClientRect();
    setRect({
      top: tr.top - rr.top,
      left: tr.left - rr.left,
      width: tr.width,
      height: tr.height,
    });
  }, [target, root]);

  // Detectar el layout bajo el cursor / clic
  useEffect(() => {
    if (!root) return;
    function onSel() {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const node = sel.getRangeAt(0).commonAncestorContainer;
      // Si la selección cae dentro del overlay, no toques el target.
      const el = node.nodeType === 1 ? node : node.parentNode;
      if (overlayRef.current && el && overlayRef.current.contains(el)) return;
      if (!root.contains(node)) return;
      setTarget(findLayout(node));
    }
    function onClick(e) {
      // Clic dentro del overlay (sus botones): no recalcular target.
      if (overlayRef.current && overlayRef.current.contains(e.target)) return;
      setTarget(findLayout(e.target));
    }
    root.addEventListener("click", onClick);
    document.addEventListener("selectionchange", onSel);
    return () => {
      root.removeEventListener("click", onClick);
      document.removeEventListener("selectionchange", onSel);
    };
  }, [root, findLayout]);

  // Recalcular posición cuando cambia target/root, scroll o resize
  // Recalcular posición cuando cambia target/root, scroll, resize o tamaño del bloque
  useEffect(() => {
    reposition();
    if (!target || !root) return;
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    // Observa cambios de alto/ancho del propio bloque al escribir dentro
    const ro = new ResizeObserver(reposition);
    ro.observe(target);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
      ro.disconnect();
    };
  }, [target, root, reposition]);

  // El overlay debe vivir dentro del root editable para que sus coordenadas
  // absolutas (relativas al root) caigan bien. Garantizamos que el root sea
  // posicionado para que actúe de offsetParent.
  useEffect(() => {
    if (!root) return;
    const prev = root.style.position;
    if (getComputedStyle(root).position === "static") root.style.position = "relative";
    return () => {
      root.style.position = prev;
    };
  }, [root]);

  function notify() {
    if (root) root.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function remove() {
    if (!target) return;
    target.remove();
    setTarget(null);
    setRect(null);
    notify();
  }

  function move(dir) {
    if (!target) return;
    const sib = dir < 0 ? target.previousElementSibling : target.nextElementSibling;
    if (!sib) return;
    if (dir < 0) target.parentNode.insertBefore(target, sib);
    else target.parentNode.insertBefore(sib, target);
    notify();
    requestAnimationFrame(reposition);
  }

  if (!root || !target || !rect) return null;

  // Portal: montamos DENTRO del root editable, no en el árbol de la barra.
  // Así el offsetParent es el propio editor y top/left (relativos al root) caen bien.
  return createPortal(
    <div
      ref={overlayRef}
      className="pointer-events-none absolute z-40"
      style={{ top: rect.top, left: rect.left, width: rect.width, height: rect.height }}
      contentEditable={false}
    >
      {/* marco de selección rodeando el bloque padre */}
      <div className="absolute inset-0 rounded-lg ring-2 ring-violet-500/60" />
      {/* barra de acciones flotante (arriba a la derecha del bloque) */}
      <div className="pointer-events-auto absolute -top-3 right-1 flex items-center gap-0.5 rounded-lg border border-slate-200 bg-white px-1 py-0.5 shadow-lg">
        <span className="flex h-6 w-5 cursor-grab items-center justify-center text-slate-400">
          <GripVertical size={14} />
        </span>
        <button
          type="button"
          title="Mover arriba"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => move(-1)}
          className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-200/70"
        >
          <ArrowUp size={14} />
        </button>
        <button
          type="button"
          title="Mover abajo"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => move(1)}
          className="flex h-6 w-6 items-center justify-center rounded text-slate-600 hover:bg-slate-200/70"
        >
          <ArrowDown size={14} />
        </button>
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <button
          type="button"
          title="Eliminar bloque"
          onMouseDown={(e) => e.preventDefault()}
          onClick={remove}
          className="flex h-6 w-6 items-center justify-center rounded hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>,
    root
  );
}

function LayoutRoot({ editor }) {
  return (
    <>
      <LayoutControl editor={editor} />
      <LayoutOverlay editor={editor} />
    </>
  );
}

export const layoutPlugin = definePlugin({
  name: "layout",
  label: "Layout en columnas",
  group: "insert",
  icon: LayoutTemplate,
  render: (e) => <LayoutRoot editor={e} />,
});
// Registrar: exportar desde src/plugins/community/index.js y pasar en plugins={[...corePlugins, layoutPlugin]}.