import { useState, useRef, useEffect, useCallback } from "react";
import {
  Image as ImageIcon, Type, PanelLeft, PanelRight,
  BringToFront, SendToBack, Trash2,
} from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

/* ===========================================================================
 *  Plugin de IMAGEN (estilo Word)
 *  - Carga por boton, y ADOPTA imagenes pegadas/arrastradas (sin tocar el core).
 *  - 5 modos: inline / izquierda / derecha / delante / detras.
 *  - Mover (drag) en modos absolutos + redimensionar con la manija.
 * ========================================================================= */

const BASE_IMG_STYLE =
  "max-width:100%;height:auto;display:inline-block;vertical-align:middle";

function readFileAsDataURL(file) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
}

function notify(root) {
  root && root.dispatchEvent(new Event("input", { bubbles: true }));
}

// Ajusta el alto minimo del editor para que contenga las imagenes ABSOLUTAS
// (delante/detras): esos elementos no aportan altura al padre por si solos.
function fitHeight(root) {
  if (!root) return;
  let max = 0;
  root.querySelectorAll("img.mesh-img").forEach((img) => {
    const w = img.getAttribute("data-wrap");
    if (w === "front" || w === "behind") {
      const bottom = (parseFloat(img.style.top) || 0) + img.offsetHeight;
      if (bottom > max) max = bottom;
    }
  });
  const needed = max > 0 ? max + 24 : 0;
  // 280 = min-h base del editable; solo extendemos si la imagen lo supera.
  root.style.minHeight = needed > 280 ? needed + "px" : "";
}

// "Adopta" una imagen pegada/arrastrada que no tenga las marcas del plugin.
function adoptImage(img) {
  if (img.getAttribute("data-wrap")) return false; // ya gestionada
  img.classList.add("mesh-img");
  img.setAttribute("data-wrap", "inline");
  img.style.maxWidth = img.style.maxWidth || "100%";
  img.style.height = img.style.height || "auto";
  if (!img.style.display) img.style.display = "inline-block";
  return true;
}

// Aplica un modo de ajuste reescribiendo los estilos inline de la imagen.
function applyMode(img, mode, root) {
  const w = img.offsetWidth;
  const left = img.offsetLeft;
  const top = img.offsetTop;

  img.setAttribute("data-wrap", mode);
  img.style.float = "";
  img.style.position = "";
  img.style.zIndex = "";
  img.style.left = "";
  img.style.top = "";
  img.style.margin = "";
  img.style.cursor = "";

  if (mode === "inline") {
    img.style.display = "inline-block";
    img.style.verticalAlign = "middle";
  } else if (mode === "left") {
    img.style.float = "left";
    img.style.margin = "4px 16px 8px 0";
  } else if (mode === "right") {
    img.style.float = "right";
    img.style.margin = "4px 0 8px 16px";
  } else if (mode === "front" || mode === "behind") {
    img.style.position = "absolute";
    img.style.zIndex = mode === "front" ? "10" : "-1";
    img.style.left = left + "px";
    img.style.top = top + "px";
    img.style.width = w + "px";
    img.style.cursor = "move";
  }
  fitHeight(root);
  notify(root);
}

/* ---- overlay: seleccion, barra flotante, mover y redimensionar ----------- */
function ImageOverlay({ editor }) {
  const [sel, setSel] = useState(null);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);
  const selRef = useRef(null);
  selRef.current = sel;

  // El surface debe ser posicionado para left/top de imagenes absolutas, y
  // crear su propio stacking context (isolate) para que el modo "detras del
  // texto" (z-index:-1) quede detras del TEXTO pero DELANTE del fondo blanco.
  useEffect(() => {
    const root = editor.getElement();
    if (!root) return;
    if (getComputedStyle(root).position === "static") root.style.position = "relative";
    root.style.isolation = "isolate";
    root.style.display = "flow-root"; // contiene los floats (modos izquierda/derecha)
  });

  // Adoptar imagenes pegadas o soltadas (la pieza que pediste).
  useEffect(() => {
    const root = editor.getElement();
    if (!root) return;
    function sweep() {
      requestAnimationFrame(() => {
        let changed = false;
        root.querySelectorAll("img:not([data-wrap])").forEach((img) => {
          if (adoptImage(img)) changed = true;
        });
        if (changed) notify(root);
      });
    }
    root.addEventListener("paste", sweep);
    root.addEventListener("drop", sweep);
    return () => {
      root.removeEventListener("paste", sweep);
      root.removeEventListener("drop", sweep);
    };
  }, [editor]);

  // Seleccionar imagen (incluye las de "detras del texto" via elementsFromPoint).
  useEffect(() => {
    function onClick(e) {
      if (e.target.closest && e.target.closest("[data-mesh-imgui]")) return;
      const root = editor.getElement();
      if (!root) return;
      const stack = document.elementsFromPoint(e.clientX, e.clientY);
      const img = stack.find((el) => el.tagName === "IMG" && root.contains(el));
      if (img) adoptImage(img); // por si era pegada y aun sin marcar
      setSel(img || null);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [editor]);

  // Reposicionar el marco al hacer scroll/resize.
  useEffect(() => {
    const onMove = () => bump();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [bump]);

  // Mover (solo modos absolutos).
  function startDrag(e) {
    const img = selRef.current;
    if (!img) return;
    const mode = img.getAttribute("data-wrap");
    if (mode !== "front" && mode !== "behind") return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const sl = parseFloat(img.style.left) || 0;
    const st = parseFloat(img.style.top) || 0;
    function move(ev) {
      img.style.left = sl + (ev.clientX - sx) + "px";
      img.style.top = st + (ev.clientY - sy) + "px";
      bump();
    }
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      fitHeight(editor.getElement());
      notify(editor.getElement());
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  // Redimensionar con la manija (mantiene proporcion via height:auto).
  function startResize(e) {
    const img = selRef.current;
    if (!img) return;
    e.preventDefault();
    e.stopPropagation(); // que no dispare el arrastre del marco
    const sx = e.clientX;
    const sw = img.offsetWidth;
    function move(ev) {
      const nw = Math.max(40, sw + (ev.clientX - sx));
      img.style.width = nw + "px";
      img.style.height = "auto";
      bump();
    }
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      fitHeight(editor.getElement());
      notify(editor.getElement());
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  function setMode(mode) {
    if (sel) { applyMode(sel, mode, editor.getElement()); bump(); }
  }
  function removeImg() {
    if (sel) {
      sel.remove();
      setSel(null);
      fitHeight(editor.getElement());
      notify(editor.getElement());
    }
  }

  if (!sel || !sel.isConnected) return null;
  const rect = sel.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  const mode = sel.getAttribute("data-wrap");
  const draggable = mode === "front" || mode === "behind";

  return (
    <>
      {/* Marco de seleccion + manija de redimension */}
      <div
        data-mesh-imgui
        onMouseDown={startDrag}
        style={{
          position: "fixed", left: rect.left, top: rect.top,
          width: rect.width, height: rect.height,
          border: "2px solid #7c3aed", borderRadius: 6, boxSizing: "border-box",
          pointerEvents: draggable ? "auto" : "none",
          cursor: draggable ? "move" : "default", zIndex: 40,
        }}
      >
        <div
          data-mesh-imgui
          onMouseDown={startResize}
          style={{
            position: "absolute", right: -7, bottom: -7,
            width: 13, height: 13, background: "#7c3aed",
            border: "2px solid #fff", borderRadius: 3,
            cursor: "nwse-resize", pointerEvents: "auto",
          }}
        />
      </div>

      {/* Mini-barra de modos */}
      <div
        data-mesh-imgui
        style={{ position: "fixed", left: rect.left, top: Math.max(8, rect.top - 44), zIndex: 41 }}
        className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
      >
        <ModeBtn icon={Type} label="En línea" active={mode === "inline"} onClick={() => setMode("inline")} />
        <ModeBtn icon={PanelLeft} label="Izquierda" active={mode === "left"} onClick={() => setMode("left")} />
        <ModeBtn icon={PanelRight} label="Derecha" active={mode === "right"} onClick={() => setMode("right")} />
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <ModeBtn icon={BringToFront} label="Delante del texto" active={mode === "front"} onClick={() => setMode("front")} />
        <ModeBtn icon={SendToBack} label="Detrás del texto" active={mode === "behind"} onClick={() => setMode("behind")} />
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <ModeBtn icon={Trash2} label="Eliminar" danger onClick={removeImg} />
      </div>
    </>
  );
}

function ModeBtn({ icon: Icon, label, active, danger, onClick }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors " +
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

/* ---- boton de carga ------------------------------------------------------ */
function ImageButton({ editor }) {
  const inputRef = useRef(null);
  async function onPick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const dataUrl = await readFileAsDataURL(file);
    editor.focus();
    editor.exec(
      "insertHTML",
      `<img class="mesh-img" data-wrap="inline" src="${dataUrl}" alt="" style="${BASE_IMG_STYLE}">`
    );
  }
  return (
    <>
      <button
        type="button"
        title="Insertar imagen"
        aria-label="Insertar imagen"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900"
      >
        <ImageIcon size={17} strokeWidth={2} />
      </button>
      <input ref={inputRef} type="file" accept="image/*" onChange={onPick} style={{ display: "none" }} />
    </>
  );
}

export const imagePlugin = definePlugin({
  name: "image",
  label: "Insertar imagen",
  group: "insert",
  icon: ImageIcon,
  render: (e) => (
    <>
      <ImageButton editor={e} />
      <ImageOverlay editor={e} />
    </>
  ),
});