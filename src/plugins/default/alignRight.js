import { AlignRight } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const alignRightPlugin = definePlugin({
  name: "alignRight", label: "Alinear a la derecha", group: "align", icon: AlignRight,
  execute: (e) => e.exec("justifyRight"),
  isActive: (e) => e.queryState("justifyRight"),
});
