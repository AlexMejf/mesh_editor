import { Heading2 } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const h2Plugin = definePlugin({
  name: "h2", label: "Titulo 2", group: "blocks", icon: Heading2,
  execute: (e) => e.exec("formatBlock", e.queryValue("formatBlock") === "h2" ? "<p>" : "<h2>"),
  isActive: (e) => e.queryValue("formatBlock") === "h2",
});
