import { useState, useRef, useEffect, useCallback } from "react";
import {
  Table as TableIcon, Move,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  PaintBucket, Trash2, X, Rows3, Columns3,
} from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

/* ===========================================================================
 *  Plugin de TABLAS
 *  - Boton de la barra: SOLO insertar (cuadricula).
 *  - Toda la edicion vive en una mini-barra flotante SOBRE la tabla:
 *    seleccionar/borrar, filas, columnas, color de celda, redimensionar.
 *  Estilos inline para sobrevivir al export.
 * ========================================================================= */

const MAX = 8;
const TABLE_STYLE = "width:100%;border-collapse:collapse;margin:14px 0;font-size:.95em;table-layout:fixed";
const TH_STYLE = "border:1px solid #e2e8f0;background:#f8fafc;padding:9px 12px;text-align:left;font-weight:600;color:#334155;word-wrap:break-word";
const TD_STYLE = "border:1px solid #e2e8f0;padding:9px 12px;color:#475569;vertical-align:top;word-wrap:break-word";
const CELL_COLORS = ["transparent", "#fee2e2", "#fef3c7", "#dcfce7", "#dbeafe", "#f3e8ff", "#f1f5f9"];

/* ---- helpers ------------------------------------------------------------- */
function ancestorTag(root, tag) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  let node = sel.getRangeAt(0).commonAncestorContainer;
  while (node && node !== root) {
    if (node.nodeType === 1 && node.tagName === tag) return node;
    node = node.parentNode;
  }
  return null;
}
const cellFromSelection = (root) => {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  let node = sel.getRangeAt(0).commonAncestorContainer;
  while (node && node !== root) {
    if (node.nodeType === 1 && (node.tagName === "TD" || node.tagName === "TH")) return node;
    node = node.parentNode;
  }
  return null;
};
function makeCell(tag) {
  const el = document.createElement(tag);
  el.setAttribute("style", tag === "th" ? TH_STYLE : TD_STYLE);
  el.innerHTML = "<br>";
  return el;
}
function buildTableHTML(rows, cols) {
  let head = "<tr>";
  for (let c = 0; c < cols; c++) head += `<th style="${TH_STYLE}">Columna ${c + 1}</th>`;
  head += "</tr>";
  let body = "";
  for (let r = 0; r < rows - 1; r++) {
    body += "<tr>";
    for (let c = 0; c < cols; c++) body += `<td style="${TD_STYLE}"><br></td>`;
    body += "</tr>";
  }
  return `<table class="mesh-table" style="${TABLE_STYLE}"><thead>${head}</thead><tbody>${body}</tbody></table><p><br></p>`;
}
function notify(root) { root && root.dispatchEvent(new Event("input", { bubbles: true })); }
function placeCaret(cell) {
  const r = document.createRange();
  r.selectNodeContents(cell); r.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges(); sel.addRange(r);
}

/* ===========================================================================
 *  Boton de la barra: solo INSERTAR (cuadricula)
 * ========================================================================= */
function TableControl({ editor }) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const boxRef = useRef(null);

  useEffect(() => {
    if (document.getElementById("mesh-table-styles")) return;
    const s = document.createElement("style");
    s.id = "mesh-table-styles";
    s.textContent = ".mesh-surface .mesh-table tbody tr:hover td{background:#faf5ff}";
    document.head.appendChild(s);
  }, []);

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
    root.__msTableRange =
      sel && sel.rangeCount && root.contains(sel.getRangeAt(0).commonAncestorContainer)
        ? sel.getRangeAt(0).cloneRange() : null;
    setHover({ r: 0, c: 0 });
    setOpen(true);
  }
  function insertTable(rows, cols) {
    const root = editor.getElement();
    editor.focus();
    const saved = root.__msTableRange;
    if (saved) { const s = window.getSelection(); s.removeAllRanges(); s.addRange(saved); }
    editor.exec("insertHTML", buildTableHTML(rows, cols));
    setOpen(false);
  }

  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button" title="Insertar tabla" aria-label="Insertar tabla" aria-expanded={open}
        onMouseDown={(e) => e.preventDefault()} onClick={handleButton}
        className={
          "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors " +
          (open ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900")
        }
      >
        <TableIcon size={17} strokeWidth={2} />
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${MAX}, 20px)` }}
               onMouseLeave={() => setHover({ r: 0, c: 0 })}>
            {Array.from({ length: MAX }).map((_, r) =>
              Array.from({ length: MAX }).map((_, c) => {
                const on = r <= hover.r && c <= hover.c;
                return (
                  <div key={`${r}-${c}`} onMouseEnter={() => setHover({ r, c })}
                       onClick={() => insertTable(r + 1, c + 1)}
                       style={{ width: 20, height: 20, borderRadius: 4, cursor: "pointer",
                                border: "1px solid " + (on ? "#7c3aed" : "#e2e8f0"),
                                background: on ? "#ede9fe" : "#fff" }} />
                );
              })
            )}
          </div>
          <div className="mt-2 text-center text-xs font-medium text-slate-500">{hover.r + 1} × {hover.c + 1}</div>
        </div>
      )}
    </div>
  );
}

/* ===========================================================================
 *  Overlay: barra flotante de edicion + manijas + seleccion/borrado
 * ========================================================================= */
function TableOverlay({ editor }) {
  const [table, setTable] = useState(null);
  const [selected, setSelected] = useState(false);
  const [pop, setPop] = useState(null); // "color" | "delete" | null
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);
  const tableRef = useRef(null);
  const selRef = useRef(false);
  const cellRef = useRef(null);
  tableRef.current = table;
  selRef.current = selected;

  // Detectar tabla y celda bajo el cursor.
  useEffect(() => {
    function update(e) {
      if (e && e.target && e.target.closest && e.target.closest("[data-mesh-tableui]")) return;
      const root = editor.getElement();
      const tbl = root ? ancestorTag(root, "TABLE") : null;
      cellRef.current = root ? cellFromSelection(root) : null;
      setTable(tbl);
      setSelected(false);
      setPop(null);
    }
    document.addEventListener("selectionchange", update);
    document.addEventListener("click", update, true);
    return () => {
      document.removeEventListener("selectionchange", update);
      document.removeEventListener("click", update, true);
    };
  }, [editor]);

  useEffect(() => {
    const onMove = () => bump();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [bump]);

  // Supr/Backspace borra la tabla seleccionada.
  useEffect(() => {
    function onKey(e) {
      if (!selRef.current || !tableRef.current) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        tableRef.current.remove();
        setTable(null); setSelected(false);
        notify(editor.getElement());
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editor]);

  // celda objetivo para las acciones (ultima conocida, o fallback)
  function targetCell() {
    const c = cellRef.current;
    if (c && tableRef.current && tableRef.current.contains(c)) return c;
    const rows = tableRef.current ? tableRef.current.querySelectorAll("tr") : null;
    return rows && rows.length ? rows[rows.length - 1].children[0] : null;
  }
  function after(fn) {
    const cell = targetCell();
    if (!cell) return;
    fn(cell, cell.closest("table"));
    notify(editor.getElement());
    setPop(null);
    bump();
  }
  function insertRow(below) {
    after((cell) => {
      const tr = cell.parentNode;
      const cols = tr.children.length;
      const newTr = document.createElement("tr");
      for (let c = 0; c < cols; c++) newTr.appendChild(makeCell("td"));
      below ? tr.after(newTr) : tr.before(newTr);
      placeCaret(newTr.children[0]);
      cellRef.current = newTr.children[0];
    });
  }
  function insertCol(right) {
    after((cell, table) => {
      const tr = cell.parentNode;
      const idx = Array.from(tr.children).indexOf(cell);
      table.querySelectorAll("tr").forEach((row) => {
        const isHead = row.parentNode.tagName === "THEAD";
        const newCell = makeCell(isHead ? "th" : "td");
        const ref = row.children[idx];
        right ? ref.after(newCell) : ref.before(newCell);
      });
    });
  }
  function deleteRow() {
    after((cell, table) => {
      if (table.querySelectorAll("tr").length <= 1) { table.remove(); setTable(null); return; }
      cell.parentNode.remove();
    });
  }
  function deleteCol() {
    after((cell, table) => {
      const idx = Array.from(cell.parentNode.children).indexOf(cell);
      const rows = table.querySelectorAll("tr");
      if (rows[0].children.length <= 1) { table.remove(); setTable(null); return; }
      rows.forEach((row) => row.children[idx]?.remove());
    });
  }
  function deleteTable() {
    after((cell, table) => { table.remove(); setTable(null); });
  }
  function fillCell(color) {
    after((cell) => { cell.style.background = color === "transparent" ? "" : color; });
  }

  // Redimensionar columna.
  function startColResize(e, th) {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sw = th.offsetWidth;
    function move(ev) { th.style.width = Math.max(30, sw + (ev.clientX - sx)) + "px"; bump(); }
    function up() {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      notify(editor.getElement());
    }
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
  }

  if (!table || !table.isConnected) return null;
  const rect = table.getBoundingClientRect();
  if (rect.width === 0) return null;
  const barTop = Math.max(8, rect.top - 46);

  const cols = [];
  const firstRow = table.querySelector("tr");
  if (firstRow) {
    Array.from(firstRow.children).forEach((cell, i, arr) => {
      if (i < arr.length - 1) cols.push({ x: cell.getBoundingClientRect().right, th: cell });
    });
  }

  return (
    <>
      {/* Marco */}
      <div data-mesh-tableui style={{
        position: "fixed", left: rect.left - 1, top: rect.top - 1,
        width: rect.width + 2, height: rect.height + 2,
        border: selected ? "2px solid #7c3aed" : "1px dashed #c4b5fd",
        borderRadius: 8, boxSizing: "border-box", pointerEvents: "none", zIndex: 38,
      }} />

      {/* Manijas de columna (ocultas cuando esta seleccionada para borrar) */}
      {!selected && cols.map((c, i) => (
        <div key={i} data-mesh-tableui onMouseDown={(e) => startColResize(e, c.th)}
          style={{ position: "fixed", left: c.x - 3, top: rect.top, width: 6, height: rect.height,
                   cursor: "col-resize", zIndex: 40 }}
          className="group flex justify-center">
          <span className="h-full w-px bg-transparent transition-colors group-hover:bg-violet-500" />
        </div>
      ))}

      {/* Mini-barra flotante de edicion (SOBRE la tabla) */}
      <div data-mesh-tableui
        style={{ position: "fixed", left: rect.left, top: barTop, zIndex: 42 }}
        className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
        <TBtn icon={Move} label="Seleccionar tabla (Supr para borrar)"
          active={selected} onClick={() => { setSelected((s) => !s); setPop(null); }} />
        <Sep />
        <TBtn icon={ArrowUp} label="Insertar fila arriba" onClick={() => insertRow(false)} />
        <TBtn icon={ArrowDown} label="Insertar fila abajo" onClick={() => insertRow(true)} />
        <Sep />
        <TBtn icon={ArrowLeft} label="Insertar columna izquierda" onClick={() => insertCol(false)} />
        <TBtn icon={ArrowRight} label="Insertar columna derecha" onClick={() => insertCol(true)} />
        <Sep />
        <TBtn icon={PaintBucket} label="Color de celda" active={pop === "color"}
          onClick={() => setPop((p) => (p === "color" ? null : "color"))} />
        <TBtn icon={Trash2} label="Eliminar…" danger active={pop === "delete"}
          onClick={() => setPop((p) => (p === "delete" ? null : "delete"))} />
      </div>

      {/* Popover de color */}
      {pop === "color" && (
        <div data-mesh-tableui
          style={{ position: "fixed", left: rect.left, top: barTop + 44, zIndex: 43 }}
          className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
          {CELL_COLORS.map((c) => (
            <button key={c} type="button" title={c === "transparent" ? "Sin relleno" : c}
              onMouseDown={(e) => e.preventDefault()} onClick={() => fillCell(c)}
              className="h-6 w-6 rounded-md border border-slate-200 transition-transform hover:scale-110"
              style={{ background: c === "transparent" ? "#fff" : c }} />
          ))}
        </div>
      )}

      {/* Popover de eliminar */}
      {pop === "delete" && (
        <div data-mesh-tableui
          style={{ position: "fixed", left: rect.left, top: barTop + 44, zIndex: 43 }}
          className="w-44 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          <DelItem icon={Rows3} label="Eliminar fila" onClick={deleteRow} />
          <DelItem icon={Columns3} label="Eliminar columna" onClick={deleteCol} />
          <DelItem icon={X} label="Eliminar tabla" onClick={deleteTable} />
        </div>
      )}
    </>
  );
}

function TBtn({ icon: Icon, label, active, danger, onClick }) {
  return (
    <button type="button" title={label} aria-label={label}
      onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className={
        "inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors " +
        (active
          ? (danger ? "bg-rose-600 text-white" : "bg-violet-600 text-white")
          : danger ? "text-slate-500 hover:bg-rose-50 hover:text-rose-600"
                   : "text-slate-600 hover:bg-slate-100")
      }>
      <Icon size={15} strokeWidth={2} />
    </button>
  );
}
function Sep() { return <span className="mx-0.5 h-5 w-px bg-slate-200" />; }
function DelItem({ icon: Icon, label, onClick }) {
  return (
    <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={onClick}
      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm text-slate-600 transition-colors hover:bg-rose-50 hover:text-rose-600">
      <Icon size={15} strokeWidth={2} />
      {label}
    </button>
  );
}

export const tablePlugin = definePlugin({
  name: "table",
  label: "Insertar tabla",
  group: "insert",
  icon: TableIcon,
  render: (e) => (
    <>
      <TableControl editor={e} />
      <TableOverlay editor={e} />
    </>
  ),
});