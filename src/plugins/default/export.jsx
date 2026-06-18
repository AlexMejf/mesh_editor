import { Download, FileCode, FileType } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";
import { useState, useRef, useEffect } from "react";

/**
 * Export Plugin
 * Allows exporting the editor content to various formats.
 */

const EXPORT_FORMATS = [
  {
    id: "html",
    label: "Exportar como HTML",
    icon: FileCode,
    extension: ".html",
    mimeType: "text/html",
    processor: (html) => {
      // Crear un documento HTML completo y limpio
      return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mesh Editor Export</title>
    <style>
        body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 20px; }
        .mesh-content { width: 100%; }
        /* Aquí podrías añadir estilos base para que el HTML se vea similar al editor */
        .mesh-card { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; margin: 14px 0; background: #fff; }
        .mesh-card-header { padding: 12px 16px; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
        .mesh-card-body { padding: 14px 16px; }
        .code-block-wrapper { background: #1e1e1e; color: #d4d4d4; border-radius: 8px; overflow: hidden; margin: 16px 0; font-family: monospace; }
        .code-header { background: #2d2d2d; padding: 6px 12px; font-size: 12px; display: flex; justify-content: space-between; }
        code { display: block; padding: 12px; white-space: pre; overflow-x: auto; }
        .line-numbers { display: none; } /* Ocultar en exportación simple */
    </style>
</head>
<body>
    <div class="mesh-content">
        ${html}
    </div>
</body>
</html>`;
    }
  }
];

function ExportControl({ editor }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    function onDown(ev) {
      if (boxRef.current && !boxRef.current.contains(ev.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const handleExport = (format) => {
    const html = editor.getHTML();
    const finalContent = format.processor(html);
    
    const blob = new Blob([finalContent], { type: format.mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `documento-${Date.now()}${format.extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative inline-block">
      <button
        type="button"
        title="Exportar documento"
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setOpen(!open)}
        className={
          "cursor-pointer inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors " +
          (open ? "bg-violet-600 text-white" : "text-slate-600 hover:bg-slate-200/70")
        }
      >
        <Download size={17} strokeWidth={2} />
      </button>
      
      {open && (
        <div className="absolute right-0 top-10 z-50 w-56 rounded-xl border border-slate-200 bg-white p-1.5 shadow-lg">
          <div className="px-2 py-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Formatos de Exportación
          </div>
          {EXPORT_FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => handleExport(f)}
              className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 transition-colors hover:bg-slate-100"
            >
              <f.icon size={16} className="text-slate-500" />
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export const exportPlugin = definePlugin({
  name: "export",
  label: "Exportar",
  group: "actions",
  icon: Download,
  render: (e) => <ExportControl editor={e} />,
});
