import React from "react";
import { Plug } from "lucide-react";

/**
 * Boton individual de la barra. Recibe el plugin y el editor por props (no usa
 * contexto) para poder reutilizarse en cualquier layout de barra.
 * Si el plugin trae `render`, le cedemos el control total de la UI.
 */
export function ToolButton({ plugin, editor }) {
  if (plugin.render) return <>{plugin.render(editor)}</>;

  const Icon = plugin.icon ?? Plug;
  const active = plugin.isActive?.(editor) ?? false;

  return (
    <button
      type="button"
      title={plugin.label}
      aria-label={plugin.label}
      aria-pressed={active}
      onMouseDown={(e) => e.preventDefault()} /* no perder la seleccion */
      onClick={() => plugin.execute?.(editor)}
      className={
        "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors cursor-pointer border-none outline-none " +
        (active
          ? "bg-violet-600 text-white"
          : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900")
      }
    >
      <Icon size={17} strokeWidth={2} />
    </button>
  );
}
