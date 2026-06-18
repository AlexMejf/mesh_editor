
/**
 * JavaScript Syntax Highlighter / Interpreter
 */

const JS_COLORS = {
  keyword: "#c586c0",   // Púrpura para keywords (if, let, const, return)
  string: "#ce9178",    // Naranja para strings
  comment: "#6a9955",   // Verde para comentarios
  number: "#b5cea8",    // Verde claro para números
  function: "#dcdcaa",  // Amarillo para nombres de funciones
  variable: "#9cdcfe",  // Celeste para variables
  punctuation: "#808080" // Gris para llaves, puntos y coma
};

export const jsInterpreter = (text) => {
  if (!text) return "";

  // 1. Escapar caracteres básicos
  let tempResult = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const placeholders = [];
  const protect = (match, color, customContent = null) => {
    const id = `___JS_TOKEN_${placeholders.length}___`;
    const content = customContent || `<span style="color: ${color}">${match}</span>`;
    placeholders.push({ id, content });
    return id;
  };

  // 2. Comentarios multilínea /* ... */ e incluso si no cierra
  tempResult = tempResult.replace(/\/\*[\s\S]*?(\*\/|$)/g, (m) => protect(m, JS_COLORS.comment));

  // 3. Comentarios de una línea //
  tempResult = tempResult.replace(/\/\/.*/g, (m) => protect(m, JS_COLORS.comment));

  // 4. Strings (comillas dobles, simples y backticks)
  tempResult = tempResult.replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, (m) => protect(m, JS_COLORS.string));

  // 5. Números
  tempResult = tempResult.replace(/\b\d+(\.\d+)?\b/g, (m) => protect(m, JS_COLORS.number));

  // 6. Keywords
  const keywords = /\b(break|case|catch|class|const|continue|debugger|default|delete|do|else|export|extends|finally|for|function|if|import|in|instanceof|new|return|super|switch|this|throw|try|typeof|var|void|while|with|yield|let|static|enum|await|async|true|false|null|undefined)\b/g;
  tempResult = tempResult.replace(keywords, (m) => protect(m, JS_COLORS.keyword));

  // 7. Funciones (nombre antes de paréntesis)
  tempResult = tempResult.replace(/\b([a-zA-Z0-9_$]+)(?=\s*\()/g, (m) => protect(m, JS_COLORS.function));

  // 8. Objetos y variables (nombre antes de un punto o identificadores comunes)
  // Evitamos keywords ya protegidas
  tempResult = tempResult.replace(/\b([a-zA-Z_$][a-zA-Z0-9_$]*)(?=\s*\.)/g, (m) => protect(m, JS_COLORS.variable));

  // 9. Puntuación especial (Amarillo): { } [ ] ( )
  tempResult = tempResult.replace(/([{}[\]()])/g, (m) => protect(m, "#ffd700"));

  // 10. Resto de puntuación (Gris): ; , . - + * / % = ! & | ^ < > ? :
  tempResult = tempResult.replace(/([;,.\-+*/%=!&|^<>?:])/g, (m) => protect(m, JS_COLORS.punctuation));

  // 11. Restaurar placeholders
  let finalResult = tempResult;
  for (let i = placeholders.length - 1; i >= 0; i--) {
    finalResult = finalResult.replace(placeholders[i].id, placeholders[i].content);
  }

  return finalResult;
};
