import React from "react";
import { useMeshEditor } from "../core/useMeshEditor";
import { ToolButton } from "./ToolButton";
import { Separator } from "./Separator";

/**
 * <ControlsEditor> — la barra de herramientas. Aqui se decide QUE se muestra.
 * Cuatro modos, de mas simple a mas control:
 *
 *   a) Sin props   -> todos los plugins montados, agrupados.
 *   b) tools={[]}   -> solo esos, en ese orden.        (lista blanca)
 *   c) exclude={[]} -> todos menos esos.               (lista negra)
 *   d) children     -> a mano: <Tool name="bold" />, <Separator />, etc.
 */
export function ControlsEditor({ tools, exclude, children, className = "" }) {
  const { plugins, pluginMap, editor } = useMeshEditor();

  // Modo (d): barra armada a mano.
  if (children) {
    return (
      <div className={"mesh-toolbar sticky top-0 z-20 " + className}>
        <div className="flex flex-wrap items-center gap-1 rounded-t-2xl border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm px-2 py-1.5">
          {children}
        </div>
      </div>
    );
  }

  // Modos (a)(b)(c): resolver la lista a mostrar.
  let list;
  if (tools) {
    list = tools.map((n) => pluginMap.get(n)).filter(Boolean);
  } else if (exclude) {
    list = plugins.filter((p) => !exclude.includes(p.name));
  } else {
    list = plugins;
  }

  // Agrupar por `group` REAL: junta todos los plugins del mismo grupo aunque
  // esten dispersos en el array. Asi el campo `group` decide la posicion en la
  // barra, no el orden en que los metiste. Se respeta el orden de PRIMERA
  // aparicion de cada grupo, y el orden de los items dentro de su grupo.
  const order = [];
  const byGroup = new Map();
  for (const p of list) {
    if (!byGroup.has(p.group)) {
      byGroup.set(p.group, []);
      order.push(p.group);
    }
    byGroup.get(p.group).push(p);
  }
  const groups = order.map((g) => ({ group: g, items: byGroup.get(g) }));

  return (
    <div className={"mesh-toolbar sticky top-0 z-20 " + className}>
      <div className="flex flex-wrap items-center gap-0.5 rounded-t-2xl border-b border-slate-200 bg-slate-50/90 backdrop-blur-sm px-2 py-1.5">
        {groups.map((g, gi) => (
          <React.Fragment key={g.group + gi}>
            {gi > 0 && <Separator />}
            {g.items.map((p) => (
              <ToolButton key={p.name} plugin={p} editor={editor} />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}