# MeshEditor

Editor de contenido modular para React. Inspirado en lo que hace bien CKEditor,
pero ligero y por bloques: **todo es un plugin** y tu decides que montas. El
export a **PDF es gratis** y viene incluido (impresion nativa del navegador).

## Instalacion

```bash
npm install mesh-editor lucide-react
```

## Uso basico

```jsx
import { MeshEditor, ControlsEditor } from "mesh-editor";

export default function App() {
  return (
    <MeshEditor onChange={(html) => console.log(html)}>
      <ControlsEditor />
    </MeshEditor>
  );
}
```

## Elegir que controles se muestran

```jsx
<ControlsEditor />                                  {/* todos */}
<ControlsEditor tools={["bold", "italic", "pdf"]} /> {/* lista blanca */}
<ControlsEditor exclude={["underline"]} />          {/* lista negra */}

{/* a mano */}
<ControlsEditor>
  <Tool name="bold" /> <Separator /> <Tool name="pdf" />
</ControlsEditor>
```

## Escribir un plugin

Un plugin es un objeto. Eso es todo lo que necesitas publicar:

```jsx
import { definePlugin } from "mesh-editor";
import { Calendar } from "lucide-react";

export const fechaPlugin = definePlugin({
  name: "fecha",
  label: "Insertar fecha",
  group: "comunidad",
  icon: Calendar,
  shortcut: "mod+d",
  execute: (editor) => editor.exec("insertText", new Date().toLocaleDateString()),
});
```

Lo montas pasandolo en `plugins`:

```jsx
<MeshEditor plugins={[...corePlugins, fechaPlugin]}>
  <ControlsEditor />
</MeshEditor>
```

## El objeto `editor`

Los plugins solo hablan con este objeto, nunca con el DOM:

| metodo | que hace |
| --- | --- |
| `exec(cmd, valor?)` | aplica un comando de formato |
| `queryState(cmd)` | true si el formato esta activo (para `isActive`) |
| `queryValue(cmd)` | valor actual (p.ej. bloque) |
| `getHTML()` / `setHTML(html)` | leer / escribir contenido |
| `getText()` | texto plano |
| `print()` | exporta a PDF (motor gratis incluido) |

## Estructura

```
src/
├─ core/         contrato de plugin, contexto, hook, capa de comandos, motor PDF
├─ components/   MeshEditor, ControlsEditor, Tool, Separator, ToolButton
└─ plugins/
   └─ default/   un archivo por funcionalidad (bold.js, pdf.js, ...)
```

Para que la comunidad aporte: cada plugin es un archivo aislado -> un PR = un archivo.
