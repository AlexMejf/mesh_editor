import { Underline } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const underlinePlugin = definePlugin({
  name: "underline", label: "Subrayado", group: "format", icon: Underline,
  shortcut: "mod+u",
  execute: (e) => e.exec("underline"),
  isActive: (e) => e.queryState("underline"),
});
