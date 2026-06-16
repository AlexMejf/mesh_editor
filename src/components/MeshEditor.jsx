import React, {
  useRef, useState, useCallback, useEffect, useMemo,
} from "react";
import { MeshContext } from "../core/MeshContext";
import { createEditorAPI } from "../core/createEditorAPI";
import { corePlugins } from "../plugins/default";
import { SurfaceStyles } from "./SurfaceStyles";

/**
 * <MeshEditor> — provider + superficie editable.
 *
 * Props:
 *   plugins      array de plugins disponibles (default: corePlugins)
 *   value        HTML inicial (NO controlado, para no romper el cursor)
 *   onChange     (html) => void
 *   placeholder  texto fantasma
 *   className    clases extra para el contenedor
 */
export function MeshEditor({
  plugins = corePlugins,
  value = "",
  onChange,
  placeholder = "Escribe algo...",
  children,
  className = "",
}) {
  const elRef = useRef(null);

  // selTick fuerza re-render de la barra cuando cambia la seleccion, SIN
  // tocar el innerHTML del editable (eso resetearia el cursor).
  const [, setSelTick] = useState(0);
  const bumpSelection = useCallback(() => setSelTick((n) => n + 1), []);
  const [isEmpty, setIsEmpty] = useState(!value);

  const notifyChange = useCallback(() => {
    const el = elRef.current;
    if (!el) return;
    setIsEmpty(el.textContent.trim() === "");
    onChange?.(el.innerHTML);
  }, [onChange]);

  const editor = useMemo(
    () => createEditorAPI(() => elRef.current, notifyChange, bumpSelection),
    [notifyChange, bumpSelection]
  );

  // Mapa nombre -> plugin, para que ControlsEditor resuelva por nombre.
  const pluginMap = useMemo(() => {
    const m = new Map();
    plugins.forEach((p) => m.set(p.name, p));
    return m;
  }, [plugins]);

  // Contenido inicial (una sola vez, no controlado).
  useEffect(() => {
    if (elRef.current && value) elRef.current.innerHTML = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualiza estado de botones al mover la seleccion.
  useEffect(() => {
    document.addEventListener("selectionchange", bumpSelection);
    return () => document.removeEventListener("selectionchange", bumpSelection);
  }, [bumpSelection]);

  // Atajos de teclado declarados por los plugins.
  const onKeyDown = useCallback(
    (e) => {
      const mod = e.metaKey || e.ctrlKey;
      for (const p of plugins) {
        if (!p.shortcut) continue;
        const parts = p.shortcut.split("+");
        const wantMod = parts.includes("mod");
        const wantShift = parts.includes("shift");
        const key = parts[parts.length - 1];
        if (wantMod === mod && wantShift === e.shiftKey &&
            e.key.toLowerCase() === key) {
          e.preventDefault();
          p.execute?.(editor);
          bumpSelection();
          return;
        }
      }
    },
    [plugins, editor, bumpSelection]
  );

  const ctx = { editor, plugins, pluginMap };

  return (
    <MeshContext.Provider value={ctx}>
      <div className={"rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden " + className}>
        {children}
        <div className="relative">
          <div
            ref={elRef}
            contentEditable
            suppressContentEditableWarning
            onInput={notifyChange}
            onKeyUp={bumpSelection}
            onMouseUp={bumpSelection}
            onKeyDown={onKeyDown}
            spellCheck
            className="mesh-surface min-h-[280px] px-6 py-5 outline-none text-slate-800 leading-relaxed"
          />
          {isEmpty && (
            <div className="pointer-events-none absolute left-6 top-5 text-slate-400 select-none">
              {placeholder}
            </div>
          )}
        </div>
      </div>
      <SurfaceStyles />
    </MeshContext.Provider>
  );
}
