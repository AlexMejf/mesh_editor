import { useState, useRef, useEffect, useCallback } from "react";
import { CreditCard, Trash2, Palette, Check, ChevronLeft } from "lucide-react";
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

function applyVariant(cardEl, v) {
  cardEl.style.borderColor = v.card;
  cardEl.setAttribute("data-variant", v.id);
  const header = cardEl.querySelector(".mesh-card-header");
  if (header) {
    header.style.background = v.headerBg;
    header.style.borderColor = v.headerBorder;
    header.style.color = v.headerColor;
  }
}

function buildCard(v) {
  const card =
    `border:1px solid ${v.card};border-radius:12px;overflow:hidden;margin:14px 0;` +
    `background:#fff;box-shadow:0 1px 2px rgba(15,23,42,.04)`;
  const header =
    `padding:12px 16px;background:${v.headerBg};border-bottom:1px solid ${v.headerBorder};` +
    `font-weight:600;color:${v.headerColor};outline:none`;
  const body = `padding:14px 16px;color:#475569;outline:none;min-height:1.4em`;

  return (
    `<div class="mesh-card" data-mesh-card="true" data-mesh-atomic="true" data-variant="${v.id}" style="${card}">` +
      `<div class="mesh-card-header" contenteditable="true" style="${header}">Título de la tarjeta</div>` +
      `<div class="mesh-card-body" data-mesh-col="true" contenteditable="true" style="${body}"><p>Contenido de la tarjeta…</p></div>` +
    `</div><p><br></p>`
  );
}

/* ---- overlay ------------------------------------------------------------- */
function CardOverlay({ editor }) {
  const [sel, setSel] = useState(null);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);
  const selRef = useRef(null);
  selRef.current = sel;

  const [varOpen, setVarOpen] = useState(false);

  // Selección de la tarjeta
  useEffect(() => {
    function onClick(e) {
      if (e.target.closest && e.target.closest("[data-mesh-cardui]")) return;
      const root = editor.getElement();
      if (!root) return;
      const stack = document.elementsFromPoint(e.clientX, e.clientY);
      const card = stack.find((el) => el.classList.contains("mesh-card") && root.contains(el));
      setSel(card || null);
      if (!card) setVarOpen(false);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [editor]);

  // Suprimir / Backspace borra la tarjeta seleccionada
  useEffect(() => {
    function onKey(e) {
      const card = selRef.current;
      if (!card) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      // Solo borrar si el foco NO está en un elemento editable (el usuario seleccionó la card pero no está escribiendo)
      if (t && t.isContentEditable) return;
      
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        const root = editor.getElement();
        card.remove();
        setSel(null);
        setVarOpen(false);
        if (root) root.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editor]);

  // Redimensionar (cambia el ancho de la tarjeta)
  function startResize(e) {
    const card = selRef.current;
    if (!card) return;
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sw = card.offsetWidth;
    function move(ev) {
      const nw = Math.max(100, sw + (ev.clientX - sx));
      card.style.width = nw + "px";
      bump();
    }
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      const root = editor.getElement();
      if (root) root.dispatchEvent(new Event("input", { bubbles: true }));
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  // Reposicionar al hacer scroll/resize
  useEffect(() => {
    const onMove = () => bump();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [bump]);

  if (!sel || !sel.isConnected) return null;
  const rect = sel.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;

  const barTop = Math.max(8, rect.top - 44);

  return (
    <>
      {/* Marco de selección + manija */}
      <div
        data-mesh-cardui
        style={{
          position: "fixed", left: rect.left, top: rect.top,
          width: rect.width, height: rect.height,
          border: "2px solid #7c3aed", borderRadius: 12, boxSizing: "border-box",
          pointerEvents: "none", zIndex: 40,
        }}
      >
        <div
          data-mesh-cardui
          onMouseDown={startResize}
          style={{
            position: "absolute", right: -7, bottom: -7,
            width: 13, height: 13, background: "#7c3aed",
            border: "2px solid #fff", borderRadius: 3,
            cursor: "nwse-resize", pointerEvents: "auto",
          }}
        />
      </div>

      {/* Mini-barra de acciones */}
      <div
        data-mesh-cardui
        style={{ position: "fixed", left: rect.left, top: barTop, zIndex: 41 }}
        className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
      >
        <ActionBtn icon={Palette} label="Cambiar color" active={varOpen} onClick={() => setVarOpen(!varOpen)} />
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <ActionBtn icon={Trash2} label="Eliminar" danger onClick={() => { 
          const root = editor.getElement();
          sel.remove(); 
          setSel(null);
          if (root) root.dispatchEvent(new Event("input", { bubbles: true }));
        }} />
      </div>

      {/* Dropdown de variantes */}
      {varOpen && (
        <div
          data-mesh-cardui
          style={{ position: "fixed", left: rect.left, top: barTop + 42, zIndex: 42 }}
          className="w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg"
        >
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                applyVariant(sel, v);
                setVarOpen(false);
                bump();
                const root = editor.getElement();
                if (root) root.dispatchEvent(new Event("input", { bubbles: true }));
              }}
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
    </>
  );
}

function ActionBtn({ icon: Icon, label, active, danger, onClick }) {
  return (
    <button
      type="button" title={label} aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={
        "cursor-pointer inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors " +
        (active
          ? "bg-violet-600 text-white"
          : danger
            ? "text-slate-500 hover:bg-rose-50 hover:text-rose-600"
            : "text-slate-600 hover:bg-slate-100")
      }
    >
      <Icon size={15} strokeWidth={2} />
    </button>
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

  // root reactivo: en el primer render el ref del editor puede ser null
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

  // cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    function onDown(ev) {
      if (boxRef.current && !boxRef.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // Manejo de teclado dentro de las celdas de la card:
  //  - Backspace/Delete no debe colapsar el <div> de header/body
  //  - Enter en el header salta al body en vez de crear otra línea de header
  //  - los saltos de línea del body sí se pueden borrar (solo se conserva 1)
  useEffect(() => {
    if (!root) return;

    function cellOf(node) {
      const el = node.nodeType === 1 ? node : node.parentNode;
      return el?.closest?.(".mesh-card-header, .mesh-card-body") || null;
    }

    // ¿la celda está en su estado mínimo? (sin texto y con 0 o 1 <br>)
    function isMinimal(cell) {
      if (cell.textContent.trim() !== "") return false;
      return cell.querySelectorAll("br").length <= 1;
    }

    function onKeyDown(ev) {
      const sel = window.getSelection();
      if (!sel || !sel.rangeCount) return;
      const range = sel.getRangeAt(0);
      const startCell = cellOf(range.startContainer);
      if (!startCell || !root.contains(startCell)) return;
      const endCell = cellOf(range.endContainer);

      // --- Enter en el HEADER: saltar al body en vez de crear línea ---
      if (ev.key === "Enter" && startCell.classList.contains("mesh-card-header")) {
        ev.preventDefault();
        const body = startCell.parentNode.querySelector(".mesh-card-body");
        if (body) {
          const r = document.createRange();
          r.selectNodeContents(body);
          r.collapse(true);
          sel.removeAllRanges();
          sel.addRange(r);
        }
        return;
      }

      if (ev.key !== "Backspace" && ev.key !== "Delete") return;

      // --- Selección colapsada: solo bloquea si la celda ya está mínima ---
      if (sel.isCollapsed) {
        if (isMinimal(startCell)) {
          ev.preventDefault();
          if (!startCell.querySelector("br")) startCell.innerHTML = "<br>";
        }
        return;
      }

      // --- Selección dentro de una sola celda: borra a mano, no colapses el div ---
      if (startCell === endCell) {
        ev.preventDefault();
        range.deleteContents();
        if (startCell.textContent.trim() === "" && !startCell.querySelector("br"))
          startCell.appendChild(document.createElement("br"));
        const r = document.createRange();
        r.selectNodeContents(startCell);
        r.collapse(true);
        sel.removeAllRanges();
        sel.addRange(r);
        root.dispatchEvent(new Event("input", { bubbles: true }));
        return;
      }

      // --- Selección que cruza celdas: bloquea para no romper la card ---
      if (startCell !== endCell) ev.preventDefault();
    }

    root.addEventListener("keydown", onKeyDown);
    return () => root.removeEventListener("keydown", onKeyDown);
  }, [root]);

  function handleButton() {
    if (open) { setOpen(false); return; }
    const r = editor.getElement();
    if (!r) return;
    const sel = window.getSelection();
    r.__msCardRange =
      sel && sel.rangeCount && r.contains(sel.getRangeAt(0).commonAncestorContainer)
        ? sel.getRangeAt(0).cloneRange()
        : null;
    setOpen(true);
  }

  function insert(v) {
    const r = editor.getElement();
    if (!r) return;
    editor.focus();
    const saved = r.__msCardRange;
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
        <CreditCard size={17} strokeWidth={2} />
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
  render: (e) => (
    <>
      <CardControl editor={e} />
      <CardOverlay editor={e} />
    </>
  ),
});
// Registrar: exportar desde src/plugins/community/index.js y pasar en plugins={[...corePlugins, cardPlugin]}.