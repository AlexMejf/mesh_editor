import { Quote } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const quotePlugin = definePlugin({
  name: "quote", label: "Cita", group: "blocks", icon: Quote,
  execute: (e) =>
    e.exec("formatBlock", e.queryValue("formatBlock") === "blockquote" ? "<p>" : "<blockquote>"),
  isActive: (e) => e.queryValue("formatBlock") === "blockquote",
});