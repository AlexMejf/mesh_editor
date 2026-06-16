import { Eye, Pencil } from "lucide-react";
import { useMeshEditor } from "../../core/useMeshEditor";
import { definePlugin } from "../../core/definePlugin";

/**
 * Boton que alterna entre edicion y vista previa del HTML renderizado.
 * No usa `editor`: lee `view`/`setView` del contexto via useMeshEditor().
 */
function PreviewToggle() {
  const { view, setView } = useMeshEditor();
  const isPreview = view === "preview";
  return (
    <button
      type="button"
      title={isPreview ? "Volver a editar" : "Vista previa"}
      aria-label={isPreview ? "Volver a editar" : "Vista previa"}
      aria-pressed={isPreview}
      onMouseDown={(ev) => ev.preventDefault()}
      onClick={() => setView(isPreview ? "edit" : "preview")}
      className={
        "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors " +
        (isPreview
          ? "bg-violet-600 text-white"
          : "text-slate-600 hover:bg-slate-200/70 hover:text-slate-900")
      }
    >
      {isPreview ? <Pencil size={17} strokeWidth={2} /> : <Eye size={17} strokeWidth={2} />}
    </button>
  );
}

export const previewPlugin = definePlugin({
  name: "preview",
  label: "Vista previa",
  group: "view",
  icon: Eye,
  render: () => <PreviewToggle />,
});