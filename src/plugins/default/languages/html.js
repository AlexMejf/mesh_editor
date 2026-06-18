
/**
 * HTML Syntax Highlighter / Interpreter
 * 
 * Este intérprete toma una cadena de texto HTML y devuelve el HTML coloreado
 * usando spans con clases específicas.
 */

const HTML_COLORS = {
  tag: "#569cd6",      // Azul para tags
  attr: "#9cdcfe",     // Celeste para atributos
  value: "#ce9178",    // Naranja para valores de atributos
  comment: "#6a9955",  // Verde para comentarios
  content: "#d4d4d4"   // Gris claro para texto plano
};

export const htmlInterpreter = (text) => {
  if (!text) return "";

  // 1. Escapar caracteres básicos
  let escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Definir los patrones de búsqueda sobre el texto escapado
  const patterns = [
    {
      // Comentarios: &lt;!-- ... --&gt;
      name: 'comment',
      regex: /&lt;!--[\s\S]*?--&gt;/g,
      color: HTML_COLORS.comment
    },
    {
      // Atributos y valores (dentro de lo que parece un tag)
      // Buscamos: espacio + nombre + ="valor"
      name: 'attrValue',
      regex: /(\s)([a-zA-Z0-9-]+)(=)(&quot;.*?&quot;|&#39;.*?&#39;)/g,
      processor: (match, space, attr, eq, value) => {
        return `${space}<span style="color: ${HTML_COLORS.attr}">${attr}</span>${eq}<span style="color: ${HTML_COLORS.value}">${value}</span>`;
      }
    },
    {
      // Tags: &lt;tag o &lt;/tag o &gt;
      name: 'tag',
      regex: /&lt;\/?[a-zA-Z0-9]+|&gt;/g,
      color: HTML_COLORS.tag
    }
  ];

  // 3. Procesamiento en una sola pasada para evitar recursión
  // Usamos un marcador temporal para las partes ya procesadas
  let tokens = [];
  let tempResult = escaped;

  // Primero extraemos y protegemos los comentarios y strings (valores)
  // para que no sean confundidos con tags
  
  // En este caso, para HTML simple, podemos usar una estrategia de "quemado":
  // Reemplazar matches por placeholders, y al final reponerlos.
  
  const placeholders = [];
  
  // Función para proteger un match
  const protect = (match, color, customContent = null) => {
    const id = `___TOKEN_${placeholders.length}___`;
    const content = customContent || `<span style="color: ${color}">${match}</span>`;
    placeholders.push({ id, content });
    return id;
  };

  // 1. Comentarios
  tempResult = tempResult.replace(patterns[0].regex, (m) => protect(m, patterns[0].color));

  // 2. Atributos y valores (necesitamos protegerlos antes que a los tags básicos)
  // Antes de eso, necesitamos asegurarnos de que las comillas estén consistentes si el texto viene de innerText
  tempResult = tempResult.replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  tempResult = tempResult.replace(patterns[1].regex, (m, s, a, e, v) => {
    return protect(m, null, patterns[1].processor(m, s, a, e, v));
  });

  // 3. Tags básicos
  tempResult = tempResult.replace(patterns[2].regex, (m) => protect(m, patterns[2].color));

  // 4. Restaurar placeholders
  let finalResult = tempResult;
  // Lo hacemos en orden inverso por si hubiera anidación accidental (aunque aquí lo evitamos)
  for (let i = placeholders.length - 1; i >= 0; i--) {
    finalResult = finalResult.replace(placeholders[i].id, placeholders[i].content);
  }

  return finalResult;
};

