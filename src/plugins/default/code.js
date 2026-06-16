import { Code } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const codePlugin = definePlugin({
  name: "code", label: "Codigo", group: "blocks", icon: Code,
  execute: (e) => e.exec("formatBlock", e.queryValue("formatBlock") === "pre" ? "<p>" : "<pre>"),
  isActive: (e) => e.queryValue("formatBlock") === "pre",
});
