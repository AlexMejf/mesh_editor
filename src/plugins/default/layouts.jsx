import { useState } from "react";
import { LayoutGrid } from "lucide-react";
import { definePlugin } from "../../core/definePlugin";

export const layoutsPlugin = definePlugin({
  name: "layouts",
  label: "Layouts (Grids)",
  group: "blocks",
  icon: LayoutGrid,
  render: (e) => {
    const [isOpen, setIsOpen] = useState(false);
    
    const insertLayout = (html) => {
      e.exec("insertHTML", html);
      setIsOpen(false);
    };

    return (
      <div className="relative">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 hover:border-violet-600 hover:text-violet-600 focus:outline-none"
        >
          <LayoutGrid size={18} />
        </button>
        {isOpen && (
          <div className="absolute left-0 top-10 z-50 flex w-32 flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
            <button 
              onClick={() => insertLayout('<div class="grid grid-cols-1 gap-2 p-2 border border-dashed border-slate-300 rounded"><div class="p-2 border border-slate-200">Texto</div></div>')}
              className="h-8 w-full bg-slate-100 hover:bg-slate-200 rounded p-1"
            >
              <div className="w-full h-full bg-slate-300 rounded"></div>
            </button>
            <button 
              onClick={() => insertLayout('<div class="grid grid-cols-2 gap-2 p-2 border border-dashed border-slate-300 rounded"><div class="p-2 border border-slate-200">Col 1</div><div class="p-2 border border-slate-200">Col 2</div></div>')}
              className="flex h-8 gap-1 p-1 bg-slate-100 hover:bg-slate-200 rounded"
            >
              <div className="w-1/2 h-full bg-slate-300 rounded"></div>
              <div className="w-1/2 h-full bg-slate-300 rounded"></div>
            </button>
          </div>
        )}
      </div>
    );
  },
});