import { useState, useRef, useEffect } from "react";
import { List, ChevronDown } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

/* ===========================================================================
 *  Plugin de LISTAS (reemplaza ul + ol en un solo boton con dropdown)
 *  Vinetas (disc/circle/square) y numeracion (1, A, a, I, i).
 * ========================================================================= */

const BULLETS = [
  { id: "disc", label: "Viñeta", sample: "•" },
  { id: "circle", label: "Círculo", sample: "◦" },
  { id: "square", label: "Cuadrado", sample: "▪" },
];
const NUMBERS = [
  { id: "decimal", label: "Números", sample: "1." },
  { id: "upper-alpha", label: "Mayúsculas", sample: "A." },
  { id: "lower-alpha", label: "Minúsculas", sample: "a." },
  { id: "upper-roman", label: "Romanos", sample: "I." },
  { id: "lower-roman", label: "Romanos min.", sample: "i." },
];

function findAncestor(root, tag) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  let node = sel.getRangeAt(0).commonAncestorContainer;
  while (node && node !== root) {
    if (node.nodeType === 1 && node.tagName === tag) return node;
    node = node.parentNode;
  }
  return null;
}

// Crea la lista si no existe y le aplica el estilo; si ya existe, solo cambia
// el estilo (sin toglear/quitarla).
function applyList(editor, command, tag, style) {
  const root = editor.getElement();
  if (!root) return;
  editor.focus();
  let list = findAncestor(root, tag);
  if (!list) {
    editor.exec(command);
    list = findAncestor(root, tag);
  }
  if (list) {
    list.style.listStyleType = style;
    root.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

function Item({ sample, label, onClick }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="cursor-pointer inline-flex w-full items-center gap-3 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
    >
      <span className="inline-flex w-5 justify-center font-mono text-slate-500">{sample}</span>
      {label}
    </button>
  );
}

function ListControl({ editor }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onDown(ev) {
      if (boxRef.current && !boxRef.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const root = editor.getElement();
  const active = root ? !!(findAncestor(root, "UL") || findAncestor(root, "OL")) : false;

  function choose(command, tag, style) {
    applyList(editor, command, tag, style);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button"
        title="Listas"
        aria-label="Listas"
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className={
          "cursor-pointer inline-flex h-8 items-center gap-0.5 rounded-lg px-1.5 transition-colors " +
          (active || open
            ? "bg-violet-600 text-white"
            : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900")
        }
      >
        <List size={17} strokeWidth={2} />
        <ChevronDown size={12} strokeWidth={2.5} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-48 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          <p className="px-2.5 py-1 text-xs font-medium text-slate-400">Viñetas</p>
          {BULLETS.map((b) => (
            <Item key={b.id} sample={b.sample} label={b.label}
              onClick={() => choose("insertUnorderedList", "UL", b.id)} />
          ))}
          <div className="my-1 h-px bg-slate-100" />
          <p className="px-2.5 py-1 text-xs font-medium text-slate-400">Numeración</p>
          {NUMBERS.map((n) => (
            <Item key={n.id} sample={n.sample} label={n.label}
              onClick={() => choose("insertOrderedList", "OL", n.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

export const listPlugin = definePlugin({
  name: "list",
  label: "Listas",
  group: "lists",
  icon: List,
  render: (e) => <ListControl editor={e} />,
});