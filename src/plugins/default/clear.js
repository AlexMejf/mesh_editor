import { RemoveFormatting } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const clearPlugin = definePlugin({
  name: "clear", label: "Quitar formato", group: "tools", icon: RemoveFormatting,
  execute: (e) => e.exec("removeFormat"),
});
