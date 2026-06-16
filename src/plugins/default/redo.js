import { Redo2 } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const redoPlugin = definePlugin({
  name: "redo", label: "Rehacer", group: "history", icon: Redo2,
  shortcut: "mod+shift+z",
  execute: (e) => e.exec("redo"),
});
