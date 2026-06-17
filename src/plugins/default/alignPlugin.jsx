import { useState, useRef, useEffect } from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify, ChevronDown } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

/* ===========================================================================
 *  Plugin de ALINEACION (reemplaza alignLeft/Center/Right en un solo boton)
 *  El boton muestra el icono de la alineacion activa.
 * ========================================================================= */

const ALIGNS = [
  { id: "left", cmd: "justifyLeft", icon: AlignLeft, label: "Izquierda" },
  { id: "center", cmd: "justifyCenter", icon: AlignCenter, label: "Centrar" },
  { id: "right", cmd: "justifyRight", icon: AlignRight, label: "Derecha" },
  { id: "justify", cmd: "justifyFull", icon: AlignJustify, label: "Justificar" },
];

function AlignControl({ editor }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onDown(ev) {
      if (boxRef.current && !boxRef.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  // El boton refleja la alineacion actual (default: izquierda).
  const current = ALIGNS.find((a) => editor.queryState(a.cmd)) || ALIGNS[0];
  const CurrentIcon = current.icon;

  function choose(cmd) {
    editor.exec(cmd);
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button"
        title="Alineación"
        aria-label="Alineación"
        aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen((o) => !o)}
        className={
          "cursor-pointer inline-flex h-8 items-center gap-0.5 rounded-lg px-1.5 transition-colors " +
          (open
            ? "bg-violet-600 text-white"
            : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900")
        }
      >
        <CurrentIcon size={17} strokeWidth={2} />
        <ChevronDown size={12} strokeWidth={2.5} />
      </button>

      {open && (
        <div className="absolute left-0 top-10 z-50 w-40 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          {ALIGNS.map((a) => {
            const I = a.icon;
            const on = editor.queryState(a.cmd);
            return (
              <button
                key={a.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(a.cmd)}
                className={
                  "cursor-pointer inline-flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors " +
                  (on ? "bg-violet-50 text-violet-700" : "text-slate-700 hover:bg-slate-100")
                }
              >
                <I size={15} strokeWidth={2} />
                {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const alignPlugin = definePlugin({
  name: "align",
  label: "Alineación",
  group: "align",
  icon: AlignLeft,
  render: (e) => <AlignControl editor={e} />,
});