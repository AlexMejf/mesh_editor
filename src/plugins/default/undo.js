import { Undo2 } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const undoPlugin = definePlugin({
  name: "undo", label: "Deshacer", group: "history", icon: Undo2,
  shortcut: "mod+z",
  execute: (e) => e.exec("undo"),
});
