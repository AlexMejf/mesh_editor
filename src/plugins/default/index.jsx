/**
 * Plugins por defecto de MeshEditor.
 *
 * Cada funcionalidad vive en su propio archivo (un archivo = un plugin).
 * Aqui solo los reunimos. Puedes importar `corePlugins` para tener todo, o
 * importar plugins sueltos para armar tu propia lista:
 *
 *   import { boldPlugin, italicPlugin, pdfPlugin } from "mesh-editor/plugins/default";
 *   <MeshEditor plugins={[boldPlugin, italicPlugin, pdfPlugin]} />
 */
export { undoPlugin } from "./undo";
export { redoPlugin } from "./redo";
export { boldPlugin } from "./bold";
export { italicPlugin } from "./italic";
export { underlinePlugin } from "./underline";
export { strikePlugin } from "./strike";
export { h1Plugin } from "./h1";
export { h2Plugin } from "./h2";
export { quotePlugin } from "./quote";
export { codePlugin } from "./code";
export { ulPlugin } from "./ul";
export { olPlugin } from "./ol";
export { alignLeftPlugin } from "./alignLeft";
export { alignCenterPlugin } from "./alignCenter";
export { alignRightPlugin } from "./alignRight";
export { linkPlugin } from "./link";
export { clearPlugin } from "./clear";
export { pdfPlugin } from "./pdf";

import { undoPlugin } from "./undo";
import { redoPlugin } from "./redo";
import { boldPlugin } from "./bold";
import { italicPlugin } from "./italic";
import { underlinePlugin } from "./underline";
import { strikePlugin } from "./strike";
import { h1Plugin } from "./h1";
import { h2Plugin } from "./h2";
import { quotePlugin } from "./quote";
import { codePlugin } from "./code";
import { ulPlugin } from "./ul";
import { olPlugin } from "./ol";
import { alignLeftPlugin } from "./alignLeft";
import { alignCenterPlugin } from "./alignCenter";
import { alignRightPlugin } from "./alignRight";
import { linkPlugin } from "./link";
import { clearPlugin } from "./clear";
import { pdfPlugin } from "./pdf";
import { fontSizePlugin } from "./fontSize";
import { highlightColorPlugin } from "./highlightColor";
import textColorPlugin from "./textColor";
import { tablePlugin } from "./default";

/** Todos los plugins por defecto, en orden de barra recomendado. */
export const corePlugins = [
  undoPlugin, redoPlugin,
  boldPlugin, italicPlugin, underlinePlugin, strikePlugin,
  h1Plugin, h2Plugin, quotePlugin, codePlugin,
  ulPlugin, olPlugin,
  alignLeftPlugin, alignCenterPlugin, alignRightPlugin,
  linkPlugin, clearPlugin,
  pdfPlugin,
  fontSizePlugin,
  highlightColorPlugin,
  textColorPlugin,
  tablePlugin
];
