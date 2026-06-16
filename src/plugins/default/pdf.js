import { FileDown } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

/**
 * Plugin de PDF GRATIS, incorporado. Es solo el boton: el motor (impresion
 * nativa -> "Guardar como PDF") vive en core/printContent.js y se invoca con
 * editor.print(). Cero dependencias, cero costo.
 */
export const pdfPlugin = definePlugin({
  name: "pdf", label: "Exportar a PDF", group: "export", icon: FileDown,
  execute: (e) => e.print(),
});
