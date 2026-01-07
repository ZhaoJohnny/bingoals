import React from 'react';
import { Type, Image as ImageIcon, Trash2, X, Paintbrush, Minus, Plus } from 'lucide-react';
import { Button } from './UI';

interface BackgroundToolbarProps {
  onAddText: () => void;
  onAddImage: () => void;
  onClear: () => void;
  onClose: () => void;
  activeColor: string;
  onColorChange: (color: string) => void;
  activeSize: number;
  onSizeChange: (size: number) => void;
}

const COLORS = [
  '#0084e8', '#55acee', '#a29bfe', '#7772c2', 
  '#f43f5e', '#fbbf24', '#10b981', '#ffffff', '#000000'
];

const SIZES = [2, 5, 10, 20, 40];

export const BackgroundToolbar: React.FC<BackgroundToolbarProps> = ({
  onAddText,
  onAddImage,
  onClear,
  onClose,
  activeColor,
  onColorChange,
  activeSize,
  onSizeChange
}) => {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] flex flex-wrap items-center gap-3 p-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-10 max-w-[95vw] sm:max-w-none">
      
      {/* Color Picker */}
      <div className="flex items-center gap-1.5 px-2 border-r border-slate-200 dark:border-slate-800">
        {COLORS.map(color => (
          <button
            key={color}
            onClick={() => onColorChange(color)}
            className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-125 ${activeColor === color ? 'border-indigo-500 scale-110 shadow-lg' : 'border-transparent'}`}
            style={{ backgroundColor: color }}
          />
        ))}
      </div>

      {/* Brush Size Picker */}
      <div className="flex items-center gap-2 px-2 border-r border-slate-200 dark:border-slate-800">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hidden sm:inline">Size</span>
        <div className="flex items-center gap-1">
          {SIZES.map(size => (
            <button
              key={size}
              onClick={() => onSizeChange(size)}
              className={`flex items-center justify-center rounded-lg transition-all ${activeSize === size ? 'bg-indigo-500 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400'}`}
              style={{ width: 28, height: 28 }}
            >
              <div 
                className="rounded-full bg-current" 
                style={{ width: Math.max(2, size / 2), height: Math.max(2, size / 2) }} 
              />
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" className="p-2 h-auto" onClick={onAddText} title="Add Text Element">
          <Type size={18} />
        </Button>
        
        <Button variant="ghost" className="p-2 h-auto" onClick={onAddImage} title="Paste Image URL">
          <ImageIcon size={18} />
        </Button>

        <Button variant="danger" className="p-2 h-auto border-none bg-red-100 dark:bg-red-900/20 hover:bg-red-200 dark:hover:bg-red-900/40" onClick={onClear} title="Clear Background">
          <Trash2 size={18} />
        </Button>
      </div>

      <div className="border-l border-slate-200 dark:border-slate-800 pl-2">
        <Button variant="ghost" className="p-2 h-auto hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500" onClick={onClose} title="Close Editor">
          <X size={18} />
        </Button>
      </div>
    </div>
  );
};