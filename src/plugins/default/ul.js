import { List } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const ulPlugin = definePlugin({
  name: "ul", label: "Lista", group: "lists", icon: List,
  execute: (e) => e.exec("insertUnorderedList"),
  isActive: (e) => e.queryState("insertUnorderedList"),
});
