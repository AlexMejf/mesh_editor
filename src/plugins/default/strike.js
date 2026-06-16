import { Strikethrough } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const strikePlugin = definePlugin({
  name: "strike", label: "Tachado", group: "format", icon: Strikethrough,
  execute: (e) => e.exec("strikeThrough"),
  isActive: (e) => e.queryState("strikeThrough"),
});
