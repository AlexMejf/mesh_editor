import { printContent } from "./printContent";

/**
 * createEditorAPI — la CAPA DE COMANDOS y el aislamiento clave de MeshEditor.
 *
 * Los plugins NUNCA tocan el DOM ni execCommand directamente: hablan con este
 * objeto `editor`. Hoy usa document.execCommand por debajo (deprecado pero
 * universal y sin peso). El dia que quieras un motor propio (modelo de
 * documento), reescribes SOLO este archivo y ningun plugin se entera.
 *
 * @param getEl         () => HTMLElement  acceso al div editable
 * @param notifyChange  () => void         avisa que cambio el contenido
 * @param bumpSelection () => void         refresca el estado activo de la barra
 */
export function createEditorAPI(getEl, notifyChange, bumpSelection) {
  const exec = (command, value = null) => {
    const el = getEl();
    if (!el) return;
    el.focus();
    document.execCommand(command, false, value);
    notifyChange();
    bumpSelection();
  };

  const queryState = (command) => {
    try { return document.queryCommandState(command); } catch { return false; }
  };

  const queryValue = (command) => {
    try { return document.queryCommandValue(command); } catch { return ""; }
  };

  return {
    exec,
    queryState,
    queryValue,
    focus: () => getEl()?.focus(),
    getHTML: () => getEl()?.innerHTML ?? "",
    setHTML: (html) => {
      const el = getEl();
      if (el) { el.innerHTML = html; notifyChange(); }
    },
    getText: () => getEl()?.innerText ?? "",
    getElement: getEl,
    print: () => printContent(getEl()),
  };
}
