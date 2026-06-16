// src/plugins/community/fontSize.js
import { useState, useRef, useEffect } from "react";
import { ALargeSmall } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

const PRESETS = [12, 14, 16, 18, 24, 32, 48]; // sugerencias (px)

function rememberSelection(e) {
  const sel = window.getSelection();
  if (!sel.rangeCount) return;
  const range = sel.getRangeAt(0);
  if (e.getElement().contains(range.commonAncestorContainer)) {
    e.getElement().__msFontRange = range.cloneRange();
  }
}

function insertSizedCaret(px, range) {
  const span = document.createElement("span");
  span.style.fontSize = `${px}px`;
  span.appendChild(document.createTextNode("\u200B")); 
  range.insertNode(span);
  const sel = window.getSelection();
  const r = document.createRange();
  r.setStart(span.firstChild, 1); 
  r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

function applyFontSizePx(e, px) {
  const el = e.getElement();
  const saved = el.__msFontRange;
  if (!saved) return;
  e.focus();
  const sel = window.getSelection();
  sel.removeAllRanges();
  sel.addRange(saved);

  if (saved.collapsed) {
    insertSizedCaret(px, saved);
    return;
  }
  document.execCommand("styleWithCSS", false, false);
  e.exec("fontSize", "7");
  el.querySelectorAll('font[size="7"]').forEach((f) => {
    const span = document.createElement("span");
    span.style.fontSize = `${px}px`;
    while (f.firstChild) span.appendChild(f.firstChild);
    f.replaceWith(span);
  });
}

function commitFontSize(e, raw) {
  const px = parseInt(raw, 10);
  if (Number.isFinite(px) && px > 0) applyFontSizePx(e, px);
}

export const fontSizePlugin = definePlugin({
  name: "fontSize",
  label: "Tamaño de fuente",
  group: "format",
  icon: ALargeSmall,
  render: (e) => {
    const [inputValue, setInputValue] = useState("14");
    const [isOpen, setIsOpen] = useState(false);
    const [isHovered, setIsHovered] = useState(null); // Para controlar el hover del menú sin clases CSS
    const containerRef = useRef(null);

    // Cerrar al hacer clic fuera
    useEffect(() => {
      function handleClickOutside(event) {
        if (containerRef.current && !containerRef.current.contains(event.target)) {
          setIsOpen(false);
        }
      }
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSelectSize = (size) => {
      setInputValue(String(size));
      commitFontSize(e, size);
      setIsOpen(false);
    };

    // Estilos basados exactamente en tu captura de pantalla
    const styles = {
      container: {
        position: "relative",
        display: "inline-block",
        fontFamily: 'Segoe UI, Roboto, Helvetica, Arial, sans-serif',
      },
      inputWrapper: {
        display: "flex",
        alignItems: "center",
        height: "34px",
        width: "110px",
        padding: "0 8px",
        borderRadius: "8px",
        border: isOpen ? "1.5px solid #8b5cf6" : "1px solid #cbd5e1", // Borde morado al abrirse
        backgroundColor: "#transparent",
        cursor: "pointer",
        boxSizing: "border-box",
      },
      icon: {
        color: "#64748b",
        marginRight: "6px",
        flexShrink: 0,
      },
      input: {
        width: "100%",
        border: "none",
        outline: "none",
        background: "transparent",
        fontSize: "14px",
        color: "#334155",
        padding: "0",
        fontWeight: "400",
      },
      arrow: {
        fontSize: "9px",
        color: "#64748b",
        marginLeft: "4px",
        userSelect: "none",
        pointerEvents: "none",
        transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.15s ease",
      },
      dropdown: {
        position: "absolute",
        top: "38px",
        left: "0",
        zIndex: 50,
        maxHeight: "180px",
        width: "110px",
        overflowY: "auto",
        backgroundColor: "#ffffff",
        borderRadius: "6px",
        border: "1px solid #0000001a",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
        padding: "4px 0",
        boxSizing: "border-box",
        scrollbarWidth: "thin",
        scrollbarColor: "#cbd5e1 transparent",
      },
      optionButton: (px) => {
        const isSelected = Number(inputValue) === px;
        return {
          display: "block",
          width: "100%",
          padding: "6px 12px",
          textAlign: "left",
          border: "none",
          background: isSelected 
            ? "#f3e8ff"  // Fondo morado suave si está seleccionado
            : isHovered === px 
              ? "#f8fafc" // Fondo gris suave al pasar el ratón
              : "transparent",
          color: isSelected ? "#6b21a8" : "#334155",
          fontSize: "14px",
          fontWeight: isSelected ? "500" : "400",
          cursor: "pointer",
        };
      }
    };

    return (
      <div ref={containerRef} style={styles.container}>
        {/* Caja visual del Input que contiene el Icono, Input real y Flecha */}
        <div 
          style={styles.inputWrapper} 
          onClick={() => setIsOpen(!isOpen)}
        >
          <ALargeSmall size={16} style={styles.icon} />
          
          <input
            type="text"
            inputMode="numeric"
            placeholder="px"
            value={inputValue}
            title="Tamaño de fuente"
            onMouseDown={() => rememberSelection(e)}
            onClick={(ev) => ev.stopPropagation()} // Evita que cierre el menú al hacer clic para escribir
            onFocus={() => setIsOpen(true)}
            onChange={(ev) => setInputValue(ev.target.value)}
            onBlur={(ev) => {
              setTimeout(() => commitFontSize(e, ev.target.value), 150);
            }}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                ev.currentTarget.blur();
                setIsOpen(false);
              }
            }}
            style={styles.input}
          />
          
          {/* Triángulo indicador hacia abajo */}
          <span style={styles.arrow}>▼</span>
        </div>

        {/* Dropdown que replica el estilo exacto de la imagen */}
        {isOpen && (
          <div style={styles.dropdown}>
            {PRESETS.map((px) => (
              <button
                key={px}
                type="button"
                onMouseEnter={() => setIsHovered(px)}
                onMouseLeave={() => setIsHovered(null)}
                onClick={(ev) => {
                  ev.stopPropagation(); // Evita burbujeos extraños
                  handleSelectSize(px);
                }}
                style={styles.optionButton(px)}
              >
                {px}px
              </button>
            ))}
          </div>
        )}
      </div>
    );
  },
});