import { useState, useRef, useEffect } from "react";
import {
  Table as TableIcon,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Trash2, X,
} from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

/* ===========================================================================
 *  Plugin de TABLAS
 *  - Sin tabla bajo el cursor -> selector de cuadricula (filas x columnas).
 *  - Con tabla bajo el cursor -> menu de edicion (filas/columnas/borrar).
 *  Los estilos base van INLINE para que el diseno sobreviva al export a PDF.
 * ========================================================================= */

const MAX = 8; // tamano maximo del selector de cuadricula

// Estilos base (inline => viajan con el HTML, sirven en el editor y en el PDF)
const TABLE_STYLE = "width:100%;border-collapse:collapse;margin:14px 0;font-size:.95em";
const TH_STYLE = "border:1px solid #e2e8f0;background:#f8fafc;padding:9px 12px;text-align:left;font-weight:600;color:#334155";
const TD_STYLE = "border:1px solid #e2e8f0;padding:9px 12px;color:#475569;min-width:64px;vertical-align:top";

/* ---- helpers de DOM (fuera del componente) ------------------------------ */

function cellFromSelection(root) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return null;
  let node = sel.getRangeAt(0).commonAncestorContainer;
  while (node && node !== root) {
    if (node.nodeType === 1 && (node.tagName === "TD" || node.tagName === "TH")) {
      return node;
    }
    node = node.parentNode;
  }
  return null;
}

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

  // El <p> final deja al usuario salir de la tabla y seguir escribiendo.
  return `<table class="mesh-table" style="${TABLE_STYLE}"><thead>${head}</thead><tbody>${body}</tbody></table><p><br></p>`;
}

// Avisa a React que el contenido cambio (manipulamos el DOM a mano).
function notify(root) {
  root.dispatchEvent(new Event("input", { bubbles: true }));
}

function placeCaret(cell) {
  const r = document.createRange();
  r.selectNodeContents(cell);
  r.collapse(true);
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(r);
}

/* ---- el control ---------------------------------------------------------- */

function TableControl({ editor }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("insert");     // "insert" | "edit"
  const [hover, setHover] = useState({ r: 0, c: 0 });
  const boxRef = useRef(null);
  const cellRef = useRef(null);                    // celda activa en modo edit

  // CSS solo-editor (hover de fila). Se inyecta una vez.
  useEffect(() => {
    if (document.getElementById("mesh-table-styles")) return;
    const s = document.createElement("style");
    s.id = "mesh-table-styles";
    s.textContent =
      ".mesh-surface .mesh-table tbody tr:hover td{background:#faf5ff}";
    document.head.appendChild(s);
  }, []);

  // Cerrar al hacer clic fuera.
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
    const cell = cellFromSelection(root);
    cellRef.current = cell;
    setMode(cell ? "edit" : "insert");
    setHover({ r: 0, c: 0 });
    // Guardamos el range para insertar donde estaba el cursor.
    const sel = window.getSelection();
    root.__msTableRange =
      sel && sel.rangeCount && root.contains(sel.getRangeAt(0).commonAncestorContainer)
        ? sel.getRangeAt(0).cloneRange()
        : null;
    setOpen(true);
  }

  /* ---- insertar tabla nueva (modo insert) ---- */
  function insertTable(rows, cols) {
    const root = editor.getElement();
    editor.focus();
    const saved = root.__msTableRange;
    if (saved) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(saved);
    }
    editor.exec("insertHTML", buildTableHTML(rows, cols));
    setOpen(false);
  }

  /* ---- operaciones de edicion (modo edit) ---- */
  function withCell(fn) {
    const cell = cellRef.current;
    const root = editor.getElement();
    if (!cell || !root.contains(cell)) { setOpen(false); return; }
    fn(cell, cell.closest("table"), root);
    notify(root);
    setOpen(false);
  }

  function insertRow(below) {
    withCell((cell) => {
      const tr = cell.parentNode;
      const cols = tr.children.length;
      const newTr = document.createElement("tr");
      for (let c = 0; c < cols; c++) newTr.appendChild(makeCell("td"));
      if (below) tr.after(newTr);
      else tr.before(newTr);
      placeCaret(newTr.children[0]);
    });
  }

  function insertCol(right) {
    withCell((cell, table) => {
      const tr = cell.parentNode;
      const idx = Array.from(tr.children).indexOf(cell);
      table.querySelectorAll("tr").forEach((row) => {
        const isHead = row.parentNode.tagName === "THEAD";
        const newCell = makeCell(isHead ? "th" : "td");
        const ref = row.children[idx];
        if (right) ref.after(newCell);
        else ref.before(newCell);
      });
      placeCaret(tr.children[right ? idx + 1 : idx]);
    });
  }

  function deleteRow() {
    withCell((cell, table) => {
      if (table.querySelectorAll("tr").length <= 1) { table.remove(); return; }
      cell.parentNode.remove();
    });
  }

  function deleteCol() {
    withCell((cell, table) => {
      const idx = Array.from(cell.parentNode.children).indexOf(cell);
      const rows = table.querySelectorAll("tr");
      if (rows[0].children.length <= 1) { table.remove(); return; }
      rows.forEach((row) => row.children[idx]?.remove());
    });
  }

  function deleteTable() {
    withCell((cell, table) => table.remove());
  }

  /* ---- UI ---- */
  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button"
        title="Tabla"
        aria-label="Tabla"
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
        <TableIcon size={17} strokeWidth={2} />
      </button>

      {open && mode === "insert" && (
        <div className="absolute right-0 top-10 z-50 rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
          <div
            className="grid gap-1"
            style={{ gridTemplateColumns: `repeat(${MAX}, 20px)` }}
            onMouseLeave={() => setHover({ r: 0, c: 0 })}
          >
            {Array.from({ length: MAX }).map((_, r) =>
              Array.from({ length: MAX }).map((_, c) => {
                const on = r <= hover.r && c <= hover.c;
                return (
                  <div
                    key={`${r}-${c}`}
                    onMouseEnter={() => setHover({ r, c })}
                    onClick={() => insertTable(r + 1, c + 1)}
                    style={{
                      width: 20, height: 20, borderRadius: 4, cursor: "pointer",
                      border: "1px solid " + (on ? "#7c3aed" : "#e2e8f0"),
                      background: on ? "#ede9fe" : "#fff",
                    }}
                  />
                );
              })
            )}
          </div>
          <div className="mt-2 text-center text-xs font-medium text-slate-500">
            {hover.r + 1} × {hover.c + 1}
          </div>
        </div>
      )}

      {open && mode === "edit" && (
        <div className="absolute right-0 top-10 z-50 w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          <MenuItem icon={ArrowUp} label="Fila arriba" onClick={() => insertRow(false)} />
          <MenuItem icon={ArrowDown} label="Fila abajo" onClick={() => insertRow(true)} />
          <MenuItem icon={ArrowLeft} label="Columna izquierda" onClick={() => insertCol(false)} />
          <MenuItem icon={ArrowRight} label="Columna derecha" onClick={() => insertCol(true)} />
          <div className="my-1 h-px bg-slate-100" />
          <MenuItem icon={Trash2} label="Eliminar fila" danger onClick={deleteRow} />
          <MenuItem icon={Trash2} label="Eliminar columna" danger onClick={deleteCol} />
          <MenuItem icon={X} label="Eliminar tabla" danger onClick={deleteTable} />
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon: Icon, label, onClick, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors " +
        (danger
          ? "text-slate-600 hover:bg-rose-50 hover:text-rose-600"
          : "text-slate-700 hover:bg-slate-100")
      }
    >
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
  render: (e) => <TableControl editor={e} />,
});
