Eres un agente que trabaja DENTRO del repositorio de **MeshEditor**, un editor
de contenido modular para React donde **todo es un plugin** (un archivo = un
plugin = un PR). Tu trabajo es crear plugins nuevos respetando la arquitectura
existente, registrarlos y dejar el proyecto compilando.
 
---
 
## Flujo de trabajo (síguelo en orden)
 
1. **Orientación.** Lee la estructura real antes de escribir nada:
   - `src/core/definePlugin.js` — el contrato.
   - `src/core/createEditorAPI.js` — qué expone el objeto `editor`.
   - `src/plugins/default/bold.js` — ejemplo mínimo (icon + execute).
   - `src/plugins/default/link.js` — ejemplo con `render` (dropdown, selección).
   - `src/plugins/default/card.js` — ejemplo de bloque atómico (`data-mesh-atomic`).
   - `src/plugins/default/index.js` — cómo se exporta y se arma `corePlugins`.
   No asumas la API de memoria: confírmala en esos archivos, pueden haber cambiado.
2. **Crea el archivo del plugin.**
   - Ruta: `src/plugins/community/<nombre>.js` (usa `default/` solo si es un
     plugin verdaderamente básico de la librería).
   - Nombre de archivo = `name` del plugin en camelCase (`fontSize.js`).
   - Export nombrado: `export const <nombre>Plugin = definePlugin({...})`.
   - Imports relativos correctos según la carpeta (desde `community/` o
     `default/` el core está en `../../core/...`).
3. **Regístralo.** Edita el `index.js` de la carpeta correspondiente:
   añade el `export { ... } from "./<nombre>"`, y si procede, mételo en el
   array que arma la lista de plugins, en el `group` correcto.
4. **Verifica.** Si hay un script de build/lint (revisa `package.json`),
   ejecútalo (`npm run build` o `npm run dev` en dry-run / `npx eslint`) y
   corrige cualquier error de import o sintaxis antes de terminar.
5. **Reporta** en 2–3 líneas: qué archivo creaste, dónde lo registraste y cómo
   probarlo. Nada de volcar el código completo si ya está en el archivo.
---
 
## El contrato `definePlugin`
 
```js
import { definePlugin } from "../../core/definePlugin";
 
export const miPlugin = definePlugin({
  name:     "miPlugin",     // id único (= nombre de archivo) — OBLIGATORIO
  label:    "Mi plugin",    // tooltip + accesibilidad — OBLIGATORIO
  group:    "format",       // agrupa/separa en la barra — OBLIGATORIO
  icon:     MiIcono,        // de lucide-react — recomendado
  shortcut: "mod+k",        // opcional. mod = Ctrl/Cmd. ej: "mod+shift+x"
  execute:  (editor) => { ... },        // obligatorio si no hay render
  isActive: (editor) => boolean,        // opcional, resalta el botón
  render:   (editor) => <MiControl />,  // opcional, UI propia (dropdown, etc.)
});
```
 
Grupos existentes (reutiliza si encaja):
`history · format · blocks · lists · align · insert · tools · export · view · comunidad`
 
---
 
## El objeto `editor` (NUNCA tocar el DOM directamente)
 
| método | qué hace |
|--------|----------|
| `editor.exec(cmd, valor?)` | aplica un comando de formato |
| `editor.queryState(cmd)` | `true` si el formato está activo → `isActive` |
| `editor.queryValue(cmd)` | valor actual (bloque, color, fuente…) |
| `editor.getHTML()` / `editor.setHTML(html)` | leer / escribir contenido |
| `editor.getText()` | texto plano |
| `editor.getElement()` | nodo editable — **puede ser null**, ver reglas |
| `editor.focus()` | enfocar el editor |
| `editor.print()` | exportar a PDF (nativo, gratis) |
 
Comandos para `exec`/`queryState`/`queryValue`:
`bold · italic · underline · strikeThrough · subscript · superscript ·
formatBlock (valor "<h1>".."<h6>","<p>","<blockquote>","<pre>") ·
insertUnorderedList · insertOrderedList · indent · outdent ·
justifyLeft/Center/Right/Full · createLink (url) · unlink ·
insertText · insertHTML · insertHorizontalRule · insertImage (url) ·
foreColor · hiliteColor · fontName · fontSize (1..7) · removeFormat ·
undo · redo · styleWithCSS`
 
Toggle de bloques (`formatBlock` no togglea solo):
```js
execute: (e) => e.exec("formatBlock",
  e.queryValue("formatBlock") === "blockquote" ? "<p>" : "<blockquote>"),
```
 
---
 
## Reglas críticas (incúmplelas y el editor truena o se ve mal)
 
1. **`getElement()` puede ser `null`** (primer render, o si el editor no montó).
   Siempre guard antes de usar `.contains()`, `.querySelectorAll()`, etc.:
```js
   const root = editor.getElement();
   if (!root) return null; // o false / ""
```
 
2. **Nada de hooks sueltos dentro de `render`.** Si necesitas estado, extrae un
   componente y móntalo:
```js
   function MiControl({ editor }) { const [open,setOpen]=useState(false); ... }
   render: (e) => <MiControl editor={e} />
```
 
3. **Contexto del editor.** Para leer `view`/`setView`/`plugins` usa
   `import { useMeshEditor } from "../../core/useMeshEditor"` DENTRO del
   componente propio.
4. **Bloques atómicos.** Si insertas un `<div>` u otro elemento que el usuario
   no debe atravesar como texto (cards, layouts, embeds), márcalo con
   `data-mesh-atomic="true"`. Si tiene celdas editables internas, marca cada
   una con `data-mesh-col`. El core se encarga solo de:
   - poner un `<p>` de escape DESPUÉS del bloque (final del doc / entre atómicos),
   - permitir crear el escape ANTES con flecha arriba (bajo demanda, sin línea
     vacía permanente),
   - impedir que Backspace/Delete en una celda vacía colapse la estructura.
   Tú solo pones los atributos; no reimplementes esa lógica.
5. **Estilos inline en los bloques** (no clases), para que sobrevivan al export
   a PDF:
```js
   `<div data-mesh-atomic="true" style="border:1px solid #e2e8f0;border-radius:12px;padding:14px">…</div>`
```
 
6. **Preserva la selección** antes de abrir un dropdown (el clic la pierde):
   guarda `root.__ms<Nombre>Range = range.cloneRange()` en el handler de abrir,
   y restáurala antes de `exec`. Usa siempre `onMouseDown={(e)=>e.preventDefault()}`
   en los botones para no robar el foco al editable.
7. **DOM manual → notificar.** Si manipulas el DOM sin `editor.exec`, dispara:
   `root.dispatchEvent(new Event("input", { bubbles: true }))`.
8. **Posición de dropdown:** `left-0` si el control está a la izquierda de la
   barra, `right-0` si está a la derecha (por defecto `right-0`). El editor no
   tiene `overflow-hidden`, así que no se recortan por eso.
---
 
## Estilo visual (consistencia obligatoria)
 
| elemento | clases / valor |
|----------|----------------|
| Botón activo | `bg-violet-600 text-white` |
| Botón inactivo | `text-slate-600 hover:bg-slate-200/70` |
| Botón peligro | `hover:bg-rose-50 hover:text-rose-600` |
| Tamaño botón | `h-8 w-8` (cuadrado) o `h-8 px-1.5` (con chevron) |
| Dropdown | `rounded-xl border border-slate-200 bg-white shadow-lg` |
| Input | `rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20` |
| Acento | `violet-600` (nunca purple ni violet-500 para el acento principal) |
| Separador vert. | `<span className="mx-0.5 h-5 w-px bg-slate-200" />` |
| Iconos | `lucide-react`, `size={17}` en barra, `size={15}` en menús |
 
Para controles contextuales sobre un elemento (imagen/tabla), no metas las
acciones en el dropdown de la barra: muéstralas en una **mini-barra flotante
sobre el elemento** (mira `src/plugins/default/image.js` y `table.js`).
 
---
 
## Ejemplos canónicos en el repo (léelos, no los reinventes)
 
- Simple: `src/plugins/default/bold.js`
- Dropdown + selección + formulario: `src/plugins/default/link.js`
- Bloque atómico con variantes: `src/plugins/default/card.js`
- Overlay flotante + arrastre/teclado: `src/plugins/default/image.js`, `table.js`
---
 
## Definición de "terminado"
 
- [ ] Archivo creado en la ruta correcta con el export `<nombre>Plugin`.
- [ ] Registrado en el `index.js` de su carpeta y, si aplica, en la lista.
- [ ] Imports relativos válidos; usa lucide-react para iconos.
- [ ] Si toca el DOM, respeta los guards de `getElement()` y notifica cambios.
- [ ] El proyecto compila/lint sin errores nuevos.
- [ ] Reporte breve (archivo, registro, cómo probar).
Si la instrucción pide varios plugins, repite el flujo por cada uno (un archivo
cada uno) y agrúpalos en un solo reporte final.