import { Code, Copy } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";
import { useEffect, useRef, useState } from "react";
import { CODE_LANGUAGES } from './languages/index'

export const codePlugin = definePlugin({
  name: "code", label: "Codigo", group: "blocks", icon: Code,
  render: (e) => <CodeControl editor={e} />,
});


const buildCode = (language) => {
  const id = `code-${Math.random().toString(36).substr(2, 9)}`;

  return (`
    <div id="${id}" data-mesh-atomic="true" class="code-block-wrapper rounded-lg overflow-hidden border border-[#333] bg-[#1e1e1e] my-4" contenteditable="false">
      
      <div class="code-header flex justify-between bg-[#2d2d2d] px-3 py-1.5 text-gray-300 text-xs font-sans select-none">
        <span>${language.label}</span>
        <button onclick="
          const code = document.getElementById('${id}').querySelector('code').innerText;
          navigator.clipboard.writeText(code);
          const btn = this;
          btn.innerText = 'Copiado!';
          setTimeout(() => btn.innerText = 'Copy', 2000);
        " class="flex flex-row items-center gap-2 cursor-pointer bg-transparent border-none text-gray-300 hover:text-white">
          ${Copy}
          Copy
        </button>
      </div>

      <div class="flex relative overflow-hidden">
        <div class="line-numbers w-10 bg-[#252526] text-gray-500 text-right px-2 py-3 font-mono text-sm select-none leading-5">1</div>

        <code contenteditable="true" spellcheck="false"
          onkeydown="
            if (event.key === 'Enter') {
              event.preventDefault();
              document.execCommand('insertText', false, '\n');
            }
            if (event.key === 'Tab') {
              event.preventDefault();
              document.execCommand('insertText', false, '  ');
            }
          "
          oninput="
            let text = this.innerText;
            if (text.endsWith('\n')) {
              text = text.slice(0, -1);
            }
            const lines = text.split('\n').length;
            
            let html = '';
            for (let i = 1; i <= lines; i++) {
              html += i + '<br>';
            }
            this.parentElement.querySelector('.line-numbers').innerHTML = html;
          "
          class="flex-1 p-3 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm outline-none whitespace-pre leading-5 overflow-x-auto"></code>
      </div>
    </div>
`);
};


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
        {
          open && (
            console.log(CODE_LANGUAGES[1]),
            <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
              {
                CODE_LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => insert(l)}
                    className="cursor-pointer inline-flex w-full items-center rounded-lg px-2 py-1.5 text-sm leading-6 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
                    {l.label}
                  </button>
                ))
              }
            </div>
          )
        }
      </button>
    </div>
  )
};
