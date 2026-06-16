import { Eraser } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const clearPlugin = definePlugin({
  name: "clear", label: "Quitar formato", group: "tools", icon: Eraser,
  execute: (e) => e.exec("removeFormat"),
});
