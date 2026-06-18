import { useState, useRef, useEffect, useCallback } from "react";
import {
  Image as ImageIcon, Type, PanelLeft, PanelRight, AlignCenter,
  BringToFront, SendToBack, Trash2, Captions, ChevronLeft, Check,
  LaptopMinimal,
} from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

/* ===========================================================================
 *  Plugin de IMAGEN (estilo Word)
 *  - Carga por boton + adopta imagenes pegadas/arrastradas.
 *  - 5 modos: inline / izquierda / derecha / delante / detras.
 *  - Mover (drag) y redimensionar (manija).
 *  - Suprimir/Backspace borra la imagen seleccionada.
 *  - Pie de pagina editable (figure + figcaption), 2 disenos.
 *  Los modos/arrastre operan sobre el "target" = figure (si hay caption) o img.
 * ========================================================================= */

const BASE_IMG_STYLE =
  "max-width:100%;height:auto;display:inline-block;vertical-align:middle";

const CAP_MINIMAL =
  "font-size:.82em;color:#64748b;text-align:center;padding:6px 4px 0;line-height:1.45";
const CAP_FILLED =
  "font-size:.82em;color:#475569;text-align:center;background:#f8fafc;" +
  "border:1px solid #e2e8f0;border-top:none;border-radius:0 0 10px 10px;" +
  "padding:8px 12px;line-height:1.45";

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

// El contenedor que se posiciona/mueve: el figure si la imagen tiene caption.
function posTarget(img) {
  return img.closest("figure.mesh-figure") || img;
}

// Ajusta el alto minimo del editor para contener targets ABSOLUTOS.
function fitHeight(root) {
  if (!root) return;
  let max = 0;
  root.querySelectorAll("img.mesh-img").forEach((img) => {
    const t = posTarget(img);
    const w = t.getAttribute("data-wrap") || img.getAttribute("data-wrap");
    if (w === "front" || w === "behind") {
      const bottom = (parseFloat(t.style.top) || 0) + t.offsetHeight;
      if (bottom > max) max = bottom;
    }
  });
  const needed = max > 0 ? max + 24 : 0;
  root.style.minHeight = needed > 280 ? needed + "px" : "";
}

function adoptImage(img) {
  if (img.getAttribute("data-wrap")) return false;
  img.classList.add("mesh-img");
  img.setAttribute("data-wrap", "inline");
  img.style.maxWidth = img.style.maxWidth || "100%";
  img.style.height = img.style.height || "auto";
  if (!img.style.display) img.style.display = "inline-block";
  return true;
}

// Aplica un modo de ajuste al target (figure o img).
function applyMode(img, mode, root) {
  const target = posTarget(img);
  const w = target.offsetWidth;
  const left = target.offsetLeft;
  const top = target.offsetTop;

  img.setAttribute("data-wrap", mode);
  if (target !== img) target.setAttribute("data-wrap", mode);

  const t = target.style;
  t.float = ""; t.position = ""; t.zIndex = "";
  t.left = ""; t.top = ""; t.margin = ""; t.cursor = "";

  if (mode === "inline") {
    t.display = "inline-block";
    t.verticalAlign = "middle";
  } else if (mode === "left") {
    t.float = "left"; t.margin = "4px 16px 8px 0";
  } else if (mode === "center") {
    t.display = "block"; t.margin = "12px auto";
  } else if (mode === "right") {
    t.float = "right"; t.margin = "4px 0 8px 16px";
  } else if (mode === "front" || mode === "behind") {
    t.position = "absolute";
    t.zIndex = mode === "front" ? "10" : "-1";
    t.left = left + "px"; t.top = top + "px";
    t.width = w + "px";
    t.cursor = "move";
  }
  fitHeight(root);
  notify(root);
}

// Crea/actualiza el pie de pagina. Envuelve la imagen en <figure> si hace falta.
function applyCaption(img, text, design, root) {
  let fig = img.closest("figure.mesh-figure");
  const mode = img.getAttribute("data-wrap") || "inline";

  if (!fig) {
    fig = document.createElement("figure");
    fig.className = "mesh-figure";
    fig.style.cssText = "margin:0;display:inline-block;max-width:100%";
    img.replaceWith(fig);
    fig.appendChild(img);
    // los estilos de posicion pasan al figure; la img queda como bloque.
    img.style.float = ""; img.style.position = ""; img.style.left = "";
    img.style.top = ""; img.style.zIndex = ""; img.style.margin = "";
    img.style.display = "block";
    applyMode(img, mode, root); // re-aplica el modo al figure recien creado
  }

  let cap = fig.querySelector("figcaption.mesh-caption");
  if (!cap) {
    cap = document.createElement("figcaption");
    cap.className = "mesh-caption";
    fig.appendChild(cap);
  }
  cap.setAttribute("style", design === "filled" ? CAP_FILLED : CAP_MINIMAL);
  cap.setAttribute("data-design", design);
  cap.textContent = text && text.trim() ? text : "Pie de foto";
  fitHeight(root);
  notify(root);
}

/* ---- overlay ------------------------------------------------------------- */
function ImageOverlay({ editor }) {
  const [sel, setSel] = useState(null);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);
  const selRef = useRef(null);
  selRef.current = sel;

  // estado del dropdown de pie de pagina
  const [capOpen, setCapOpen] = useState(false);
  const [capStep, setCapStep] = useState(1);
  const [capDesign, setCapDesign] = useState("minimal");
  const [capText, setCapText] = useState("");

  // surface: posicionado + stacking context + contiene floats.
  useEffect(() => {
    const root = editor.getElement();
    if (!root) return;
    if (getComputedStyle(root).position === "static") root.style.position = "relative";
    root.style.isolation = "isolate";
    root.style.display = "flow-root";
  });

  // Adoptar imagenes pegadas/soltadas.
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

  // Seleccionar imagen (incluye las de "detras del texto").
  useEffect(() => {
    function onClick(e) {
      if (e.target.closest && e.target.closest("[data-mesh-imgui]")) return;
      const root = editor.getElement();
      if (!root) return;
      const stack = document.elementsFromPoint(e.clientX, e.clientY);
      const img = stack.find((el) => el.tagName === "IMG" && root.contains(el));
      if (img) adoptImage(img);
      setSel(img || null);
      if (!img) setCapOpen(false);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [editor]);

  // Suprimir / Backspace borra la imagen seleccionada.
  useEffect(() => {
    function onKey(e) {
      const img = selRef.current;
      if (!img) return;
      const t = e.target;
      // no borrar si se escribe en el formulario o en el propio caption
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (t && t.isContentEditable && t.closest && t.closest("figcaption")) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        posTarget(img).remove();
        setSel(null);
        setCapOpen(false);
        fitHeight(editor.getElement());
        notify(editor.getElement());
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editor]);

  // Reposicionar marco al hacer scroll/resize.
  useEffect(() => {
    const onMove = () => bump();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [bump]);

  // Mover (modos absolutos) — mueve el target (figure o img).
  function startDrag(e) {
    const img = selRef.current;
    if (!img) return;
    const target = posTarget(img);
    const mode = target.getAttribute("data-wrap") || img.getAttribute("data-wrap");
    if (mode !== "front" && mode !== "behind") return;
    e.preventDefault();
    const sx = e.clientX, sy = e.clientY;
    const sl = parseFloat(target.style.left) || 0;
    const st = parseFloat(target.style.top) || 0;
    function move(ev) {
      target.style.left = sl + (ev.clientX - sx) + "px";
      target.style.top = st + (ev.clientY - sy) + "px";
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

  // Redimensionar (cambia el ancho de la imagen; el figure se ajusta).
  function startResize(e) {
    const img = selRef.current;
    if (!img) return;
    const target = posTarget(img);
    e.preventDefault();
    e.stopPropagation();
    const sx = e.clientX;
    const sw = img.offsetWidth;
    function move(ev) {
      const nw = Math.max(40, sw + (ev.clientX - sx));
      img.style.width = nw + "px";
      img.style.height = "auto";
      if (target !== img) target.style.width = ""; // que el figure siga al img
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
      posTarget(sel).remove();
      setSel(null);
      setCapOpen(false);
      fitHeight(editor.getElement());
      notify(editor.getElement());
    }
  }

  // Pie de pagina
  function toggleCaption() {
    if (capOpen) { setCapOpen(false); return; }
    const img = selRef.current;
    if (!img) return;
    const cap = img.closest("figure.mesh-figure")?.querySelector("figcaption.mesh-caption");
    if (cap) {
      setCapDesign(cap.getAttribute("data-design") || "minimal");
      setCapText(cap.textContent === "Pie de foto" ? "" : cap.textContent);
      setCapStep(2);
    } else {
      setCapDesign("minimal");
      setCapText("");
      setCapStep(1);
    }
    setCapOpen(true);
  }
  function chooseDesign(d) { setCapDesign(d); setCapStep(2); }
  function doApplyCaption() {
    if (!sel) return;
    applyCaption(sel, capText, capDesign, editor.getElement());
    setCapOpen(false);
    bump();
  }

  if (!sel || !sel.isConnected) return null;
  const target = posTarget(sel);
  const rect = target.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;
  const mode = target.getAttribute("data-wrap") || sel.getAttribute("data-wrap");
  const draggable = mode === "front" || mode === "behind";
  const barTop = Math.max(8, rect.top - 44);

  return (
    <>
      {/* Marco + manija */}
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

      {/* Mini-barra de acciones */}
      <div
        data-mesh-imgui
        style={{ position: "fixed", left: rect.left, top: barTop, zIndex: 41 }}
        className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
      >
        <ModeBtn icon={Type} label="En línea" active={mode === "inline"} onClick={() => setMode("inline")} />
        <ModeBtn icon={PanelLeft} label="Izquierda" active={mode === "left"} onClick={() => setMode("left")} />
        <ModeBtn icon={AlignCenter} label="Centrar" active={mode === "center"} onClick={() => setMode("center")} />
        <ModeBtn icon={PanelRight} label="Derecha" active={mode === "right"} onClick={() => setMode("right")} />
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <ModeBtn icon={BringToFront} label="Delante del texto" active={mode === "front"} onClick={() => setMode("front")} />
        <ModeBtn icon={SendToBack} label="Detrás del texto" active={mode === "behind"} onClick={() => setMode("behind")} />
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <ModeBtn icon={LaptopMinimal} label="Pie de página" active={capOpen} onClick={toggleCaption} />
        <ModeBtn icon={Trash2} label="Eliminar" danger onClick={removeImg} />
      </div>

      {/* Dropdown de pie de pagina (2 pasos) */}
      {capOpen && (
        <div
          data-mesh-imgui
          style={{ position: "fixed", left: rect.left, top: barTop + 42, zIndex: 42 }}
          className="w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-lg"
        >
          {capStep === 1 ? (
            <>
              <p className="mb-2 text-xs font-medium text-slate-500">Elige un diseño</p>
              <div className="flex gap-2">
                <DesignCard label="Minimalista" onClick={() => chooseDesign("minimal")} filled={false} />
                <DesignCard label="Con relleno" onClick={() => chooseDesign("filled")} filled={true} />
              </div>
            </>
          ) : (
            <>
              <div className="mb-2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setCapStep(1)}
                  className="inline-flex items-center gap-0.5 text-xs text-slate-500 hover:text-slate-700"
                >
                  <ChevronLeft size={14} /> Diseño
                </button>
                <span className="ml-auto text-xs text-slate-400">
                  {capDesign === "filled" ? "Con relleno" : "Minimalista"}
                </span>
              </div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Texto del pie</label>
              <input
                type="text"
                autoFocus
                value={capText}
                placeholder="Escribe el pie de foto"
                onChange={(ev) => setCapText(ev.target.value)}
                onKeyDown={(ev) => { if (ev.key === "Enter") { ev.preventDefault(); doApplyCaption(); } }}
                className="mb-3 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm text-slate-700 outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20"
              />
              <button
                type="button"
                onClick={doApplyCaption}
                className="inline-flex w-full items-center justify-center gap-1 rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-violet-700"
              >
                <Check size={14} /> Aplicar pie
              </button>
            </>
          )}
        </div>
      )}
    </>
  );
}

function ModeBtn({ icon: Icon, label, active, danger, onClick }) {
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

// Mini-preview de los disenos de pie de pagina.
function DesignCard({ label, filled, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="cursor-pointer flex flex-1 flex-col items-center gap-1.5 rounded-lg border border-slate-200 p-2 text-xs text-slate-600 transition-colors hover:border-violet-400 hover:bg-violet-50/40"
    >
      <span className="w-full">
        <span style={{ display: "block", height: 22, background: "#e2e8f0", borderRadius: "4px 4px 0 0" }} />
        <span
          style={{
            display: "block", height: 10, fontSize: 0,
            background: filled ? "#f8fafc" : "transparent",
            border: filled ? "1px solid #e2e8f0" : "none",
            borderTop: filled ? "none" : undefined,
            borderRadius: filled ? "0 0 4px 4px" : 0,
          }}
        />
      </span>
      {label}
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
        type="button" title="Insertar imagen" aria-label="Insertar imagen"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-200/70 hover:text-slate-900"
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