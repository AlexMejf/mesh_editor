/**
 * definePlugin — el contrato de un plugin de MeshEditor.
 *
 * Un plugin es solo un objeto. Esto es todo lo que alguien necesita publicar
 * para que su funcionalidad entre a la barra de herramientas:
 *
 *   definePlugin({
 *     name:     'bold',                 // id único (obligatorio)
 *     label:    'Negrita',              // tooltip + accesibilidad
 *     group:    'format',               // para agrupar/separar en la barra
 *     icon:     Bold,                   // componente de ícono (lucide, etc.)
 *     shortcut: 'mod+b',                // atajo opcional ('mod' = Ctrl/Cmd)
 *     execute:  (editor) => editor.exec('bold'),
 *     isActive: (editor) => editor.queryState('bold'),  // resalta el botón
 *     render:   (editor) => <MiControl />,              // opcional: UI propia
 *   })
 *
 * definePlugin no hace magia: valida lo mínimo y pone defaults. Existe para
 * que el contrato sea explícito y para poder tiparlo en TS más adelante.
 */
export function definePlugin(plugin) {
  if (!plugin || !plugin.name) {
    throw new Error("definePlugin: un plugin necesita la propiedad 'name'.");
  }
  return { group: "default", ...plugin };
}
