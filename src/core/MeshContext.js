import { createContext } from "react";

/**
 * Contexto interno que comparte el estado del editor entre <MeshEditor>
 * y todos sus hijos (la barra, los botones, plugins, etc.).
 * No se exporta al publico: para leerlo se usa el hook useMeshEditor().
 */
export const MeshContext = createContext(null);
