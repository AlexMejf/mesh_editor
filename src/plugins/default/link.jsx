import { useState, useRef, useEffect } from "react";
import { Link as LinkIcon, Check, Unlink } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

/* ---- helpers (fuera del componente, no dependen de React) ---------------- */

const escapeHtml = (s = "") =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;")
   .replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// Si el usuario escribe "ejemplo.com" le ponemos https:// delante.
// Respeta mailto:, tel:, anclas (#) y rutas absolutas (/).
function normalizeUrl(raw) {
  const v = (raw || "").trim();
  if (!v) return "";
  if (/^(https?:|mailto:|tel:|#|\/)/i.test(v)) return v;
  return "https://" + v;
}

// Busca un <a> que contenga la seleccion actual, sin salir del editor.
function anchorFromSelection(root) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  let node = sel.getRangeAt(0).commonAncestorContainer;
  while (node && node !== root) {
    if (node.nodeType === 1 && node.tagName === "A") return node;
    node = node.parentNode;
  }
  return null;
}

/* ---- el control (dropdown con formulario texto + url) -------------------- */

function LinkControl({ editor }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [editing, setEditing] = useState(false); // editando un <a> existente?
  const boxRef = useRef(null);
  const textRef = useRef(null);

  // Cerrar al hacer clic fuera del control.
  useEffect(() => {
    function onDown(ev) {
      if (boxRef.current && !boxRef.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Enfocar el primer campo al abrir.
  useEffect(() => {
    if (open) setTimeout(() => textRef.current?.focus(), 0);
  }, [open]);

  function openPanel() {
    const root = editor.getElement();
    const existing = anchorFromSelection(root);

    if (existing) {
      // Editar: seleccionamos el <a> completo y precargamos sus datos.
      const r = document.createRange();
      r.selectNode(existing);
      root.__msLinkRange = r;
      setText(existing.textContent);
      setUrl(existing.getAttribute("href") || "");
      setEditing(true);
    } else {
      // Nuevo: guardamos el range y precargamos el texto seleccionado.
      const sel = window.getSelection();
      const range = sel && sel.rangeCount ? sel.getRangeAt(0) : null;
      const inside = range && root.contains(range.commonAncestorContainer);
      root.__msLinkRange = inside ? range.cloneRange() : null;
      setText(range ? range.toString() : "");
      setUrl("");
      setEditing(false);
    }
    setOpen(true);
  }

  function handleButton() {
    if (open) { setOpen(false); return; } // toggle
    openPanel();
  }

  function restoreRange() {
    const root = editor.getElement();
    const saved = root.__msLinkRange;
    editor.focus();
    if (!saved) return;
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(saved);
  }

  function apply() {
    const href = normalizeUrl(url);
    if (!href) return; // sin URL no hacemos nada
    restoreRange();
    const label = text && text.trim() ? text : href;
    editor.exec(
      "insertHTML",
      `<a href="${escapeHtml(href)}">${escapeHtml(label)}</a>`
    );
    setOpen(false);
  }

  function remove() {
    restoreRange();
    editor.exec("unlink");
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative inline-block">
      {/* Boton de la barra: mismo estilo que los demas ToolButton */}
      <button
        type="button"
        title="Insertar enlace"
        aria-label="Insertar enlace"
        aria-expanded={open}
        onMouseDown={(ev) => ev.preventDefault()} /* no perder la seleccion */
        onClick={handleButton}
        className={
          "cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors" +
          (open
            ? "bg-violet-600 text-white"
            : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900")
        }
      >
        <LinkIcon size={17} strokeWidth={2} />
      </button>

      {/* Dropdown con el formulario */}
      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <label className="mb-1 block text-xs font-medium text-slate-500">
            Texto
          </label>
          <input
            ref={textRef}
            type="text"
            value={text}
            placeholder="Texto a mostrar"
            onChange={(ev) => setText(ev.target.value)}
            className="mb-2.5 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />

          <label className="mb-1 block text-xs font-medium text-slate-500">
            URL
          </label>
          <input
            type="text"
            value={url}
            placeholder="https://ejemplo.com"
            onChange={(ev) => setUrl(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") { ev.preventDefault(); apply(); }
            }}
            className="mb-3 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
          />

          <div className="flex items-center justify-between">
            {editing ? (
              <button
                type="button"
                onClick={remove}
                className="cursor-pointer inline-flex items-center gap-1 text-sm text-slate-500 transition-colors hover:text-rose-600"
              >
                <Unlink size={14} /> Quitar
              </button>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={apply}
              disabled={!url.trim()}
              className="inline-flex items-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Check size={14} /> {editing ? "Guardar" : "Aplicar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export const linkPlugin = definePlugin({
  name: "link",
  label: "Insertar enlace",
  group: "insert",
  icon: LinkIcon,
  render: (e) => <LinkControl editor={e} />,
});