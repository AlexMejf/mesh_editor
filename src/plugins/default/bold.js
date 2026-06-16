import { Bold } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const boldPlugin = definePlugin({
  name: "bold", label: "Negrita", group: "format", icon: Bold,
  shortcut: "mod+b",
  execute: (e) => e.exec("bold"),
  isActive: (e) => e.queryState("bold"),
});
