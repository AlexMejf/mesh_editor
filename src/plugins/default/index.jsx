/**
 * Plugins por defecto de MeshEditor.
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
export { linkPlugin } from "./link";
export { clearPlugin } from "./clear";
export { pdfPlugin } from "./pdf";
export { exportPlugin } from "./export";

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
import { linkPlugin } from "./link";
import { clearPlugin } from "./clear";
import { pdfPlugin } from "./pdf";
import { fontSizePlugin } from "./fontSize";
import { highlightColorPlugin } from "./highlightColor";
import textColorPlugin from "./textColor";
import { tablePlugin } from "./default";
import { previewPlugin } from "./preview";
import { cardPlugin } from "./card";
import { imagePlugin } from "./image";
import { alignPlugin } from "./alignPlugin";
import { listPlugin } from "./listPlugin";
import { layoutPlugin } from "./layouts";
import { exportPlugin } from "./export";

/** Todos los plugins por defecto, en orden de barra recomendado. */
export const corePlugins = [
  undoPlugin, redoPlugin,
  alignPlugin, listPlugin,
  boldPlugin, italicPlugin, underlinePlugin, strikePlugin,
  h1Plugin, h2Plugin, quotePlugin, codePlugin,
  linkPlugin, clearPlugin,
  pdfPlugin,
  exportPlugin,
  fontSizePlugin,
  highlightColorPlugin,
  textColorPlugin,
  tablePlugin,
  layoutPlugin,
  previewPlugin,
  cardPlugin,
  imagePlugin,
];
