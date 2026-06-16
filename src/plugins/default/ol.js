import { ListOrdered } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const olPlugin = definePlugin({
  name: "ol", label: "Lista numerada", group: "lists", icon: ListOrdered,
  execute: (e) => e.exec("insertOrderedList"),
  isActive: (e) => e.queryState("insertOrderedList"),
});
