import React, { useState, useMemo } from "react";
import {
  MeshEditor, ControlsEditor, Tool, Separator,
  definePlugin, corePlugins,
} from "../src";

// Ejemplo de plugin "de la comunidad": inserta la fecha de hoy.


export default function App() {
  const [html, setHtml] = useState("");

  return (
    <div className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-4xl">
        {/* Modo completo */}
        <MeshEditor  onChange={setHtml}>
          <ControlsEditor />
        </MeshEditor>

        {/* Modo minimo: solo estos botones */}
        {/* <ControlsEditor tools={["bold", "italic", "ul", "pdf"]} /> */}

        {/* Modo manual: */}
        {/*
        <ControlsEditor>
          <Tool name="bold" /> <Tool name="italic" />
          <Separator />
          <Tool name="fecha" /> <Tool name="pdf" />
        </ControlsEditor>
        */}
      </div>
    </div>
  );
}
