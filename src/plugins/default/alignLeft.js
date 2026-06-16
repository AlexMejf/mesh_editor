import { AlignLeft } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const alignLeftPlugin = definePlugin({
  name: "alignLeft", label: "Alinear a la izquierda", group: "align", icon: AlignLeft,
  execute: (e) => e.exec("justifyLeft"),
  isActive: (e) => e.queryState("justifyLeft"),
});
