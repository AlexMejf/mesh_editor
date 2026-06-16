import React from "react";

/**
 * Estilos del area editable, encapsulados con el prefijo .mesh-surface para
 * que NO se filtren al resto de tu web (el problema clasico de CKEditor).
 */
export function SurfaceStyles() {
  return (
    <style>{`
      .mesh-surface h1{font-size:1.7rem;font-weight:700;margin:.6em 0 .3em}
      .mesh-surface h2{font-size:1.35rem;font-weight:700;margin:.6em 0 .3em}
      .mesh-surface blockquote{border-left:3px solid #6d5dfc;padding:.1em 0 .1em 1em;margin:.6em 0;color:#64748b}
      .mesh-surface pre{background:#f4f3fb;padding:.8em 1em;border-radius:10px;font-family:ui-monospace,monospace;font-size:.9em;overflow:auto}
      .mesh-surface ul{list-style:disc;padding-left:1.4em}
      .mesh-surface ol{list-style:decimal;padding-left:1.4em}
      .mesh-surface a{color:#6d5dfc;text-decoration:underline}
    `}</style>
  );
}
