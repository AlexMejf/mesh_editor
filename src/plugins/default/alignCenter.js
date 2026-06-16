import { AlignCenter } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const alignCenterPlugin = definePlugin({
  name: "alignCenter", label: "Centrar", group: "align", icon: AlignCenter,
  execute: (e) => e.exec("justifyCenter"),
  isActive: (e) => e.queryState("justifyCenter"),
});
