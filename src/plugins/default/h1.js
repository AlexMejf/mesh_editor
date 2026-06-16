import { Heading1 } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const h1Plugin = definePlugin({
  name: "h1", label: "Titulo 1", group: "blocks", icon: Heading1,
  execute: (e) => e.exec("formatBlock", e.queryValue("formatBlock") === "h1" ? "<p>" : "<h1>"),
  isActive: (e) => e.queryValue("formatBlock") === "h1",
});
