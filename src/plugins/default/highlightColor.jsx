// src/plugins/community/highlightColor.js
import { useState, useRef, useEffect } from "react";
import { PaintRoller } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

const PRESET_COLORS = [
  "#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#fed7aa",
  "#fef9c3", "#dcfce7", "#dbeafe", "#fce7f3", "#ffedd5",
  "#ffffff", "#f1f5f9", "#e2e8f0", "#cbd5e1", "#94a3b8"
];

// Parsea cualquier color CSS a [r,g,b]; null si es transparente o no se entiende.
function toRgb(str) {
  if (!str) return null;
  let m = str.match(/rgba?\(([^)]+)\)/i);
  if (m) {
    const p = m[1].split(",").map((s) => s.trim());
    const a = p[3] === undefined ? 1 : parseFloat(p[3]);
    if (a === 0) return null; // transparente = sin resaltado
    return [parseInt(p[0]), parseInt(p[1]), parseInt(p[2])];
  }
  m = str.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// Sube por los ancestros (dentro del editor) buscando la propiedad aplicada de verdad.
function findAppliedColor(editorEl, prop) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  const node = sel.getRangeAt(0).commonAncestorContainer;
  let el = node.nodeType === 3 ? node.parentElement : node;
  if (!el || !editorEl.contains(el)) return null;
  while (el && el !== editorEl) {
    if (el.style && el.style[prop]) return el.style[prop]; // inline (lo que escribe el plugin)
    if (prop === "backgroundColor" && el.tagName === "MARK") return getComputedStyle(el).backgroundColor;
    el = el.parentElement;
  }
  return null;
}

function rememberSelection(e) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (e.getElement().contains(range.commonAncestorContainer)) {
    e.getElement().__msHighlightRange = range.cloneRange();
  }
}

function applyHighlight(e, color) {
  e.focus();
  const saved = e.getElement().__msHighlightRange;
  if (saved) {
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(saved);
  }
  document.execCommand("styleWithCSS", false, true);
  e.exec("hiliteColor", color);
}

export const highlightColorPlugin = definePlugin({
  name: "highlightColor",
  label: "Color de resaltado",
  group: "format",
  icon: PaintRoller,
  isActive: (e) => {
    const c = toRgb(findAppliedColor(e.getElement(), "backgroundColor"));
    if (!c) return false;                                   // sin resaltado / transparente
    return !(c[0] === 255 && c[1] === 255 && c[2] === 255); // activo solo si NO es blanco
  },
  render: (e) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const active = highlightColorPlugin.isActive?.(e) || isOpen;

    useEffect(() => {
      function handleClickOutside(event) {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectColor = (color) => {
      applyHighlight(e, color);
      setIsOpen(false);
    };

    return (
      <div ref={containerRef} className="relative inline-block">
        <button
          type="button"
          title="Color de resaltado"
          onMouseDown={() => rememberSelection(e)}
          onClick={() => setIsOpen(!isOpen)}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer border-none outline-none ${
            active ? "bg-violet-600 text-white"
              : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900"
          }`}
        >
          <PaintRoller size={16} />
        </button>

        {isOpen && (
          <div className="absolute left-0 top-9 z-50 w-[150px] rounded-lg border border-black/10 bg-white p-2.5 shadow-lg box-border">
            <div className="grid grid-cols-5 gap-1.5 mb-2.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => handleSelectColor(color)}
                  style={{ backgroundColor: color }}
                  className={`h-5 w-5 rounded cursor-pointer transition-transform hover:scale-110 ${
                    color === "#ffffff" ? "border border-slate-300" : "border-none"
                  }`}
                />
              ))}
            </div>

            <div className="my-2 h-px bg-slate-200" />

            <div className="flex items-center gap-2">
              <input
                type="color"
                onChange={(ev) => applyHighlight(e, ev.target.value)}
                className="h-6 w-6 p-0 border-none bg-transparent cursor-pointer rounded"
              />
              <span className="text-xs text-slate-500 font-sans select-none">Más colores</span>
            </div>
          </div>
        )}
      </div>
    );
  }
});

export default highlightColorPlugin;