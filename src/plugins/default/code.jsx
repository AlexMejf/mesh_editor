import { Code, Copy, Trash2, Palette, Languages } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";
import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { CODE_LANGUAGES } from './languages/index'

export const codePlugin = definePlugin({
  name: "code", label: "Codigo", group: "blocks", icon: Code,
  render: (e) => (
    <>
      <CodeGlobalSetup />
      <CodeControl editor={e} />
      <CodeOverlay editor={e} />
    </>
  ),
});

function CodeGlobalSetup() {
  useEffect(() => {
    window.__MESH_INTERPRETERS = CODE_LANGUAGES.reduce((acc, lang) => {
      if (lang.dictionary) acc[lang.id] = lang.dictionary;
      return acc;
    }, {});
  }, []);
  return null;
}

function applyLanguage(blockEl, lang) {
  blockEl.setAttribute("data-lang", lang.id);
  const headerSpan = blockEl.querySelector(".code-header span");
  if (headerSpan) headerSpan.textContent = lang.label;
  
  // Forzar actualización del resaltado inmediatamente
  const codeEl = blockEl.querySelector("code");
  if (codeEl) {
    codeEl.dispatchEvent(new Event("input", { bubbles: true }));
  }
}

const buildCode = (language) => {
  const id = `code-${Math.random().toString(36).substr(2, 9)}`;

  return (`
    <div id="${id}" data-mesh-atomic="true" data-lang="${language.id}" class="code-block-wrapper" style="border-radius:8px; overflow:hidden; border:1px solid #333; background:#1e1e1e; margin:16px 0;" contenteditable="false">
      
      <div class="code-header" contenteditable="false" style="display:flex; justify-content:space-between; background:#2d2d2d; padding:6px 12px; color:#d1d5db; font-size:12px; font-family:sans-serif; user-select:none;">
        <span>${language.label}</span>
        <button contenteditable="false" onclick="
          const code = this.closest('.code-block-wrapper').querySelector('code');
          navigator.clipboard.writeText(code.innerText);
          const btn = this;
          const oldHTML = btn.innerHTML;
          btn.innerHTML = '<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'14\\' height=\\'14\\' viewBox=\\'0 0 24 24\\' fill=\\'none\\' stroke=\\'currentColor\\' stroke-width=\\'2\\' stroke-linecap=\\'round\\' stroke-linejoin=\\'round\\'><polyline points=\\'20 6 9 17 4 12\\'></polyline></svg>';
          setTimeout(() => btn.innerHTML = oldHTML, 2000);
        " style="display:flex; align-items:center; gap:8px; cursor:pointer; background:transparent; border:none; color:#d1d5db; padding:0;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='#d1d5db'">
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path></svg>
        </button>
      </div>

      <div class="flex relative overflow-hidden" style="display:flex; position:relative; overflow:hidden;" contenteditable="false">
        <div class="line-numbers" style="width:40px; background:#252526; color:#858585; text-align:right; padding:12px 8px; font-family:monospace; font-size:14px; user-select:none; line-height:20px;" contenteditable="false">1</div>

        <code contenteditable="true" spellcheck="false"
          onfocus="document.execCommand('defaultParagraphSeparator', false, 'div');"
          onkeydown="
            if (event.key === 'Backspace' || event.key === 'Delete') {
              const codeEl = this;
              const sel = window.getSelection();
              const isFullSel = sel.rangeCount > 0 && !sel.isCollapsed && 
                                (sel.getRangeAt(0).commonAncestorContainer === codeEl || 
                                 sel.getRangeAt(0).commonAncestorContainer.parentElement === codeEl);
                                 
              if (isFullSel || codeEl.querySelectorAll('div').length <= 1) {
                setTimeout(() => {
                  if (codeEl.querySelectorAll('div').length === 0) {
                    codeEl.innerHTML = '<div><br></div>';
                    const range = document.createRange();
                    range.setStart(codeEl.firstChild, 0);
                    range.collapse(true);
                    sel.removeAllRanges();
                    sel.addRange(range);
                  }
                }, 0);
              }
            }
            if (event.key === 'Tab') {
              event.preventDefault();
              document.execCommand('insertText', false, '  ');
            }
            if (event.key === 'Enter') {
              const selection = window.getSelection();
              if (selection.rangeCount > 0) {
                const range = selection.getRangeAt(0);
                const codeEl = this;
                
                // Detectar si estamos entre etiquetas (p.ej. <div>|</div>)
                // Obtenemos el texto antes y después del cursor en el nodo actual
                const container = range.startContainer;
                const offset = range.startOffset;
                const text = container.textContent || '';
                const before = text.substring(0, offset);
                const after = text.substring(offset);

                // Regex simple para detectar si estamos entre un tag que abre y uno que cierra
                // Ejemplo: ...> y <...
                if (before.trim().endsWith('>') && after.trim().startsWith('<')) {
                  event.preventDefault();
                  
                  // Encontrar el div actual
                  let currentDiv = container;
                  while(currentDiv && currentDiv.parentElement !== codeEl) {
                    currentDiv = currentDiv.parentElement;
                  }

                  if (currentDiv) {
                    // Calculamos la indentación del div actual para mantenerla
                    const currentIndent = currentDiv.innerText.match(/^\s*/)[0];
                    const newIndent = currentIndent + '  ';

                    // Insertar estructura:
                    // <div>indent</div>
                    // <div>indent + 2</div> <- cursor aquí
                    // <div>indent</div>
                    
                    // Creamos el contenido de la línea actual (truncada)
                    currentDiv.innerText = before; 
                    
                    // Creamos la línea indentada
                    const middleDiv = document.createElement('div');
                    middleDiv.innerHTML = newIndent + '<br>';
                    
                    // Creamos la línea de cierre
                    const closingDiv = document.createElement('div');
                    closingDiv.innerText = currentIndent + after;
                    
                    // Insertar después de la actual
                    currentDiv.after(middleDiv);
                    middleDiv.after(closingDiv);
                    
                    // Mover cursor al middleDiv (después del indent)
                    const newRange = document.createRange();
                    newRange.setStart(middleDiv.childNodes[0], newIndent.length);
                    newRange.collapse(true);
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                    
                    // Forzar actualización de líneas
                    codeEl.dispatchEvent(new Event('input', { bubbles: true }));
                  }
                }
              }
            }
          "
          oninput="
            const codeEl = this;
            if (codeEl.childNodes.length === 0 || (codeEl.childNodes.length === 1 && codeEl.firstChild.nodeType === 3)) {
              codeEl.innerHTML = '<div><br></div>';
            }
            
            const selection = window.getSelection();
            let savedOffset = 0;
            let targetNode = null;
            
            if (selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              targetNode = range.startContainer;
              savedOffset = range.startOffset;
              
              let temp = targetNode;
              while(temp && temp !== codeEl && temp.parentElement !== codeEl) {
                let prev = temp.previousSibling;
                while(prev) {
                  savedOffset += prev.textContent.length;
                  prev = prev.previousSibling;
                }
                temp = temp.parentElement;
              }
              targetNode = temp;
            }

            const langId = codeEl.closest('.code-block-wrapper').getAttribute('data-lang');
            const divs = codeEl.querySelectorAll('div');
            const count = divs.length || 1;
            codeEl.parentElement.querySelector('.line-numbers').innerHTML = 
              Array.from({length: count}, (_, i) => i + 1).join('<br>');

            if (window.__MESH_INTERPRETERS && window.__MESH_INTERPRETERS[langId]) {
              const interpreter = window.__MESH_INTERPRETERS[langId];
              divs.forEach(div => {
                const text = div.innerText.replace(/\\n$/, '');
                const html = text === '' ? '<br>' : interpreter(text);
                if (div.innerHTML !== html) {
                   div.innerHTML = html;
                }
              });

              if (targetNode && selection.rangeCount > 0) {
                try {
                  const newRange = document.createRange();
                  let currentPos = 0;
                  let found = false;
                  
                  function traverse(node) {
                    if (found) return;
                    if (node.nodeType === 3) {
                      if (currentPos + node.length >= savedOffset) {
                        newRange.setStart(node, savedOffset - currentPos);
                        newRange.setEnd(node, savedOffset - currentPos);
                        found = true;
                      } else {
                        currentPos += node.length;
                      }
                    } else if (node.nodeName === 'BR' && savedOffset === currentPos) {
                       newRange.setStartBefore(node);
                       newRange.setEndBefore(node);
                       found = true;
                    } else {
                      if (node.childNodes.length === 0 && savedOffset === currentPos) {
                        newRange.setStart(node, 0);
                        newRange.setEnd(node, 0);
                        found = true;
                        return;
                      }
                      for (let i = 0; i < node.childNodes.length; i++) {
                        traverse(node.childNodes[i]);
                      }
                    }
                  }
                  
                  traverse(targetNode);
                  if (found) {
                    selection.removeAllRanges();
                    selection.addRange(newRange);
                  }
                } catch(e) { console.error('Restoring cursor failed', e); }
              }
            }
          "
          onpaste="
            event.preventDefault();
            const text = event.clipboardData.getData('text/plain');
            document.execCommand('insertText', false, text);
          "
          class="flex-1 p-3 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm outline-none whitespace-pre leading-5 overflow-x-auto"><div><br></div></code>
      </div>
    </div><p><br></p>
`);
};

// ---------- overlay ------------------------------------------------------------- 
function CodeOverlay({ editor }) {
  const [sel, setSel] = useState(null);
  const [, setTick] = useState(0);
  const bump = useCallback(() => setTick((n) => n + 1), []);
  const selRef = useRef(null);
  selRef.current = sel;

  const [langOpen, setLangOpen] = useState(false);
  const [overlayContainer, setOverlayContainer] = useState(null);

  // surface initialization
  useEffect(() => {
    const root = editor.getElement();
    if (!root) return;
    if (getComputedStyle(root).position === "static") root.style.position = "relative";
    root.style.isolation = "isolate";
    root.style.display = "flow-root";

    // Contenedor externo para overlays (independencia de exportación)
    const parent = root.parentElement;
    let container = parent.querySelector(".mesh-overlays-portal");
    if (!container) {
      container = document.createElement("div");
      container.className = "mesh-overlays-portal";
      container.style.position = "absolute";
      container.style.top = "0";
      container.style.left = "0";
      container.style.width = "100%";
      container.style.pointerEvents = "none";
      container.setAttribute("contenteditable", "false");
      root.after(container);
    }
    setOverlayContainer(container);
  }, [editor]);

  // Selection
  useEffect(() => {
    function onClick(e) {
      if (e.target.closest && e.target.closest("[data-mesh-codeui]")) return;
      const root = editor.getElement();
      if (!root) return;
      const stack = document.elementsFromPoint(e.clientX, e.clientY);
      const block = stack.find((el) => el.classList.contains("code-block-wrapper") && root.contains(el));
      setSel(block || null);
      if (!block) setLangOpen(false);
    }
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [editor]);

  // Delete
  useEffect(() => {
    function onKey(e) {
      const block = selRef.current;
      if (!block) return;
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (t && t.isContentEditable && t.closest && t.closest(".code-block-wrapper")) return;
      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        block.remove();
        setSel(null);
        setLangOpen(false);
        const root = editor.getElement();
        root.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [editor]);

  // Reposition
  useEffect(() => {
    const onMove = () => bump();
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [bump]);

  if (!sel || !sel.isConnected || !overlayContainer) return null;
  const rect = sel.getBoundingClientRect();
  const rootRect = editor.getElement().getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return null;

  const top = rect.top - rootRect.top;
  const left = rect.left - rootRect.left;
  const barTop = Math.max(8, top - 44);

  return createPortal(
    <>
      {/* Marco de selección */}
      <div
        data-mesh-codeui
        style={{
          position: "absolute", left: left, top: top,
          width: rect.width, height: rect.height,
          border: "2px solid #7c3aed", borderRadius: 8, boxSizing: "border-box",
          pointerEvents: "none", zIndex: 40,
        }}
      />

      {/* Mini-barra de acciones */}
      <div
        data-mesh-codeui
        style={{ position: "absolute", left: left, top: barTop, zIndex: 41, pointerEvents: "auto" }}
        className="flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-lg"
      >
        <ActionBtn icon={Languages} label="Lenguaje" active={langOpen} onClick={() => setLangOpen(!langOpen)} />
        <span className="mx-0.5 h-5 w-px bg-slate-200" />
        <ActionBtn icon={Trash2} label="Eliminar" danger onClick={() => { sel.remove(); setSel(null); }} />
      </div>

      {/* Dropdown de lenguajes */}
      {langOpen && (
        <div
          data-mesh-codeui
          style={{ position: "absolute", left: left, top: barTop + 42, zIndex: 42, pointerEvents: "auto" }}
          className="w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg max-h-60 overflow-y-auto"
        >
          {CODE_LANGUAGES.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => {
                applyLanguage(sel, l);
                setLangOpen(false);
                bump();
                const root = editor.getElement();
                root.dispatchEvent(new Event("input", { bubbles: true }));
              }}
              className="cursor-pointer flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <span className="font-medium">{l.label}</span>
            </button>
          ))}
        </div>
      )}
    </>,
    overlayContainer
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

const CodeControl = ({ editor }) => {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);


  function handleButton() {
    if (open) { setOpen(false); return; }
    const root = editor.getElement();
    if (!root) return;
    const sel = window.getSelection();
    root.__msCodeRange =
      sel && sel.rangeCount && root.contains(sel.getRangeAt(0).commonAncestorContainer)
        ? sel.getRangeAt(0).cloneRange()
        : null;
    setOpen(true);
  }

  function insert(v) {
    const root = editor.getElement();
    if (!root) return;
    editor.focus();
    const saved = root.__msCodeRange;
    if (saved) {
      const s = window.getSelection();
      s.removeAllRanges();
      s.addRange(saved);
    }
    editor.exec("insertHTML", buildCode(v));
    setOpen(false);
  }

  useEffect(() => {
    function onDown(ev) {
      if (open && boxRef.current && !boxRef.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);


  return (
    <div ref={boxRef} className="cursor-pointer relative inline-block">
      <button
        type="button"
        title="Insertar codigo"
        aria-label="Insertar codigo"
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
        <Code size={17} strokeWidth={2} />
      </button>
      {
        open && (
          <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg max-h-60 overflow-y-auto">
            {
              CODE_LANGUAGES.map((l) => (
                <button
                  key={l.id}
                  onClick={() => insert(l)}
                  className="cursor-pointer inline-flex w-full items-center rounded-lg px-2 py-1.5 text-sm leading-6 text-slate-700 hover:bg-slate-50 hover:text-slate-900 text-left">
                  {l.label}
                </button>
              ))
            }
          </div>
        )
      }
    </div>
  )
};

