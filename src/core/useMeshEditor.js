import { useContext } from "react";
import { MeshContext } from "./MeshContext";

/**
 * Hook publico. Lo usan los plugins con render propio y cualquier componente
 * hijo que necesite hablar con el editor.
 *
 *   const { editor, plugins, pluginMap } = useMeshEditor();
 *   editor.exec('bold');
 */
export function useMeshEditor() {
  const ctx = useContext(MeshContext);
  if (!ctx) {
    throw new Error("useMeshEditor() debe usarse dentro de <MeshEditor>.");
  }
  return ctx;
}
