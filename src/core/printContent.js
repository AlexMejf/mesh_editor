/**
 * printContent — el motor del PDF GRATIS de MeshEditor.
 *
 * Abre una ventana de impresion con una hoja de estilos limpia y dispara el
 * dialogo nativo del navegador -> "Guardar como PDF". Cero dependencias, cero
 * costo. Vive en el core (no en el plugin) porque es una capacidad del editor:
 * el plugin 'pdf' es solo el boton que llama a editor.print().
 *
 * Si quieres descarga directa sin dialogo, instala el plugin opcional con
 * jsPDF (@mesh-editor/plugin-pdf-download) en vez de tocar esto.
 */
export function printContent(el, { title = "Documento" } = {}) {
  if (!el) return;
  const win = window.open("", "_blank", "width=800,height=1000");
  if (!win) {
    alert("Habilita las ventanas emergentes para exportar a PDF.");
    return;
  }
  win.document.write(`<!doctype html><html><head><meta charset="utf-8">
    <title>${title}</title>
    <style>
      body{font:16px/1.7 -apple-system,Segoe UI,Roboto,sans-serif;color:#1e1b2e;
           max-width:720px;margin:48px auto;padding:0 24px;}
      h1{font-size:1.8rem;margin:1.2em 0 .4em} h2{font-size:1.4rem;margin:1em 0 .4em}
      blockquote{border-left:3px solid #6d5dfc;margin:1em 0;padding:.2em 1em;color:#555}
      pre{background:#f4f3fb;padding:1em;border-radius:8px;overflow:auto;font-family:monospace}
      a{color:#6d5dfc} img{max-width:100%}
    </style></head><body>${el.innerHTML}</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); win.close(); }, 250);
}
