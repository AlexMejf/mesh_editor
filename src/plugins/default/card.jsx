import { useState, useRef, useEffect } from "react";
import { CreditCard  } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

/* ===========================================================================
 *  Plugin de TARJETAS (cards)
 *  Inserta una card con header + body. Estilos INLINE -> sobreviven al export.
 *  Varias variantes de color, todas con la paleta de la libreria.
 * ========================================================================= */

const VARIANTS = [
  {
    id: "neutral", label: "Neutra",
    card: "#e2e8f0", headerBg: "#f8fafc", headerColor: "#334155", headerBorder: "#e2e8f0",
  },
  {
    id: "accent", label: "Acento",
    card: "#ddd6fe", headerBg: "#f5f3ff", headerColor: "#6d28d9", headerBorder: "#ede9fe",
  },
  {
    id: "info", label: "Info",
    card: "#bfdbfe", headerBg: "#eff6ff", headerColor: "#1d4ed8", headerBorder: "#dbeafe",
  },
];

function buildCard(v) {
  const card =
    `border:1px solid ${v.card};border-radius:12px;overflow:hidden;margin:14px 0;` +
    `background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.04)`;
  const header =
    `padding:12px 16px;background:${v.headerBg};border-bottom:1px solid ${v.headerBorder};` +
    `font-weight:600;color:${v.headerColor}`;
  const body = `padding:14px 16px;color:#475569`;
 
  return (
    `<div class="mesh-card" data-mesh-atomic="true" style="${card}">` +
      `<div class="mesh-card-header" style="${header}">Título de la tarjeta</div>` +
      `<div class="mesh-card-body" style="${body}">Contenido de la tarjeta…</div>` +
    `</div><p><br></p>`
  );
}

/* ---- mini-preview que se ve en el dropdown ------------------------------ */
function MiniCard({ v }) {
  return (
    <span
      style={{
        display: "inline-block", width: 46, height: 32, borderRadius: 7,
        border: `1px solid ${v.card}`, overflow: "hidden", background: "#fff",
        boxShadow: "0 1px 2px rgba(15,23,42,.05)", flexShrink: 0,
      }}
    >
      <span style={{ display: "block", height: 11, background: v.headerBg, borderBottom: `1px solid ${v.headerBorder}` }} />
    </span>
  );
}

/* ---- el control --------------------------------------------------------- */
function CardControl({ editor }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onDown(ev) {
      if (boxRef.current && !boxRef.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function handleButton() {
    if (open) { setOpen(false); return; }
    const root = editor.getElement();
    if (!root) return;
    const sel = window.getSelection();
    root.__msCardRange =
      sel && sel.rangeCount && root.contains(sel.getRangeAt(0).commonAncestorContainer)
        ? sel.getRangeAt(0).cloneRange()
        : null;
    setOpen(true);
  }

  function insert(v) {
    const root = editor.getElement();
    if (!root) return;
    editor.focus();
    const saved = root.__msCardRange;
    if (saved) {
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(saved);
    }
    editor.exec("insertHTML", buildCard(v));
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="cursor-pointer relative inline-block">
      <button
        type="button"
        title="Insertar tarjeta"
        aria-label="Insertar tarjeta"
        aria-expanded={open}
        onMouseDown={(ev) => ev.preventDefault()}
        onClick={handleButton}
        className={
          "cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors " +
          (open
            ? "bg-violet-600 text-white"
            : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900")
        }
      >
        <CreditCard  size={17} strokeWidth={2} />
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => insert(v)}
              className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <MiniCard v={v} />
              <span>
                <span className="block font-medium">Tarjeta {v.label}</span>
                <span className="block text-xs text-slate-400">Header + body</span>
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const cardPlugin = definePlugin({
  name: "card",
  label: "Insertar tarjeta",
  group: "insert",
  icon: CreditCard,
  render: (e) => <CardControl editor={e} />,
});