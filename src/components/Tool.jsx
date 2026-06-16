import React from "react";
import { useMeshEditor } from "../core/useMeshEditor";
import { ToolButton } from "./ToolButton";

/**
 * Pieza para armar la barra a mano:
 *   <ControlsEditor>
 *     <Tool name="bold" /> <Tool name="pdf" />
 *   </ControlsEditor>
 */
export function Tool({ name }) {
  const { pluginMap, editor } = useMeshEditor();
  const plugin = pluginMap.get(name);
  if (!plugin) return null;
  return <ToolButton plugin={plugin} editor={editor} />;
}
