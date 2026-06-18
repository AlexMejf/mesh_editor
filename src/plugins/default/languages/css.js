
/**
 * CSS Syntax Highlighter / Interpreter
 */

const CSS_COLORS = {
  selector: "#d7ba7d", // Dorado/Amarillo para selectores
  property: "#9cdcfe", // Celeste para propiedades
  value: "#ce9178",    // Naranja para valores
  comment: "#6a9955",  // Verde para comentarios
  punctuation: "#d4d4d4" // Gris para llaves y puntos y coma
};

export const cssInterpreter = (text) => {
  if (!text) return "";

  // 1. Escapar caracteres básicos
  let tempResult = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  const placeholders = [];
  const protect = (match, color, customContent = null) => {
    const id = `___CSS_TOKEN_${placeholders.length}___`;
    const content = customContent || `<span style="color: ${color}">${match}</span>`;
    placeholders.push({ id, content });
    return id;
  };

  // 2. Proteger Comentarios: /* ... */
  tempResult = tempResult.replace(/\/\*[\s\S]*?\*\//g, (m) => protect(m, CSS_COLORS.comment));

  // 3. Proteger Strings (valores entre comillas)
  tempResult = tempResult.replace(/("[^"]*"|'[^']*')/g, (m) => protect(m, CSS_COLORS.value));

  // 4. Resaltar Reglas: propiedad: valor;
  // Buscamos algo que parezca una propiedad (letras y guiones seguido de :)
  tempResult = tempResult.replace(/([a-zA-Z-]+)\s*(:)\s*([^;{}]+)\s*(;)/g, (match, prop, colon, val, semi) => {
    const highlightedProp = `<span style="color: ${CSS_COLORS.property}">${prop}</span>`;
    const highlightedVal = `<span style="color: ${CSS_COLORS.value}">${val}</span>`;
    return protect(match, null, `${highlightedProp}${colon}${highlightedVal}${semi}`);
  });

  // 5. Selectores: lo que queda fuera de las llaves que no sea puntuación
  // Esta es una aproximación simple para selectores antes de una llave {
  tempResult = tempResult.replace(/([^{}\s][^{}]*)\s*(?=\{)/g, (m, selector) => {
    return protect(selector, CSS_COLORS.selector);
  });

  // 6. Restaurar placeholders
  let finalResult = tempResult;
  for (let i = placeholders.length - 1; i >= 0; i--) {
    finalResult = finalResult.replace(placeholders[i].id, placeholders[i].content);
  }

  return finalResult;
};
