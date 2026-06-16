import { Italic } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const italicPlugin = definePlugin({
  name: "italic", label: "Cursiva", group: "format", icon: Italic,
  shortcut: "mod+i",
  execute: (e) => e.exec("italic"),
  isActive: (e) => e.queryState("italic"),
});
