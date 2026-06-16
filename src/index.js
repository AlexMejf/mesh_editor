/**
 * MeshEditor — punto de entrada publico de la libreria.
 * Editor de contenido modular para React. Todo es un plugin.
 */

// Componentes
export { MeshEditor } from "./components/MeshEditor";
export { ControlsEditor } from "./components/ControlsEditor";
export { Tool } from "./components/Tool";
export { Separator } from "./components/Separator";

// API para autores de plugins
export { definePlugin } from "./core/definePlugin";
export { useMeshEditor } from "./core/useMeshEditor";

// Plugins por defecto (incluye el de PDF gratis)
export { corePlugins } from "./plugins/default";
export * from "./plugins/default";
