import React, { useState } from 'react';
import { GameSession, Resolution } from '../types';
import { Check, Info, Edit2, Save, X } from 'lucide-react';
import { Modal, Button } from './UI';

interface BoardProps {
  session: GameSession;
  currentUserId?: string;
  isInteractive?: boolean;
  onSquareClick?: (resId: string) => void;
  onUpdateNote?: (resId: string, note: string) => void;
}

export const Board: React.FC<BoardProps> = ({ 
  session, 
  currentUserId, 
  isInteractive = false,
  onSquareClick,
  onUpdateNote
}) => {
  const { gridSize, resolutions, users, checks } = session;
  const userChecks = currentUserId ? (checks[currentUserId] || []) : [];
  const totalSquares = gridSize * gridSize;
  const centerIndex = Math.floor(totalSquares / 2);

  const [selectedRes, setSelectedRes] = useState<Resolution | null>(null);
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [tempNote, setTempNote] = useState('');

  const getAuthor = (id: string) => users.find(u => u.id === id);

  const gridCells = Array.from({ length: totalSquares }, (_, i) => {
    return resolutions.find(r => r.gridIndex === i);
  });

  const handleStartEdit = () => {
    setTempNote(selectedRes?.note || '');
    setIsEditingNote(true);
  };

  const handleSaveNote = () => {
    if (selectedRes && onUpdateNote) {
      onUpdateNote(selectedRes.id, tempNote);
      setSelectedRes({ ...selectedRes, note: tempNote });
      setIsEditingNote(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingNote(false);
  };

  return (
    <>
      <div 
        className="grid gap-2 sm:gap-3 w-full h-full aspect-square select-none mx-auto"
        style={{ 
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
        }}
      >
        {gridCells.map((res, idx) => {
          const isCenter = idx === centerIndex;
          if (!res) {
               return (
                <div key={`empty-${idx}`} className={`flex items-center justify-center rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 ${isCenter ? 'bg-slate-100 dark:bg-slate-900/80' : 'bg-white dark:bg-slate-900/40'} text-slate-300 dark:text-slate-700`}>
                   {isCenter ? (
                     <span className="text-xl sm:text-2xl opacity-40">⭐</span>
                   ) : (
                     <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-slate-200 dark:bg-slate-800" />
                   )}
                </div>
              );
          }

          const isFree = res.isFree;
          const isChecked = isFree || (isInteractive && userChecks.includes(res.id));
          const author = getAuthor(res.authorId);

          return (
            <div
              key={res.id || idx}
              onClick={() => isInteractive && !isFree && onSquareClick?.(res.id)}
              className={`
                relative group flex flex-col items-center justify-center p-2 sm:p-4 text-center rounded-xl sm:rounded-2xl border transition-all duration-300 overflow-hidden
                ${isInteractive && !isFree ? 'cursor-pointer hover:scale-[1.02] hover:shadow-xl dark:hover:shadow-indigo-900/30 active:scale-95' : ''}
                ${isFree 
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-700/50 text-amber-600 dark:text-amber-200' 
                  : isChecked 
                    ? 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-200 dark:border-emerald-700/50 text-emerald-600 dark:text-emerald-100 shadow-inner' 
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 hover:border-[#a29bfe] dark:hover:border-slate-500 hover:bg-slate-50 dark:hover:bg-slate-750'}
              `}
            >
              {/* Author Badge */}
              {!isFree && author && (
                <div 
                  className="absolute top-1 right-1 sm:top-2 sm:right-2 w-4 h-4 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[7px] sm:text-[10px] font-black text-white shadow-lg z-10 border border-white dark:border-slate-900"
                  style={{ backgroundColor: author.color }}
                  title={author.name}
                >
                  {author.name.substring(0, 2).toUpperCase()}
                </div>
              )}

              {/* Info/Note Icon */}
              {!isFree && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedRes(res);
                    setIsEditingNote(false);
                  }}
                  className={`absolute bottom-1 right-1 sm:bottom-2 sm:right-2 z-10 p-0.5 sm:p-1 rounded-lg backdrop-blur-sm transition-colors ${res.note ? 'text-[#a29bfe] dark:text-indigo-400 bg-indigo-500/5 dark:bg-indigo-500/10' : 'text-slate-300 dark:text-slate-500 bg-slate-50/60 dark:bg-slate-900/40 hover:text-[#a29bfe] dark:hover:text-indigo-400'}`}
                >
                  <Info className="w-2.5 h-2.5 sm:w-4 sm:h-4" />
                </button>
              )}

              {/* Content */}
              <div className={`
                z-10 px-1 break-words w-full font-bold leading-tight sm:leading-snug
                text-[9px] min-[400px]:text-[10px] sm:text-xs md:text-sm lg:text-base xl:text-lg
                ${isChecked ? 'line-through opacity-30 dark:opacity-25' : ''}
              `}>
                {res.text}
              </div>

              {/* Check Overlay */}
              {isChecked && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] dark:opacity-[0.05] z-0">
                  <Check size="85%" strokeWidth={6} />
                </div>
              )}
              
              {/* Free Space Star */}
              {isCenter && (
                <span className="text-xl sm:text-4xl lg:text-5xl mt-1 z-10 opacity-60">⭐</span>
              )}
            </div>
          );
        })}
      </div>

      <Modal 
        isOpen={!!selectedRes} 
        onClose={() => setSelectedRes(null)} 
        title={selectedRes?.text || "Details"}
      >
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-950/50 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Goal Details / Equivalencies</h4>
              {!isEditingNote && (
                <button 
                  onClick={handleStartEdit}
                  className="text-[#55acee] dark:text-indigo-400 hover:text-[#449bdd] dark:hover:text-indigo-300 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  <Edit2 size={12} />
                  Edit Note
                </button>
              )}
            </div>

            {isEditingNote ? (
              <div className="space-y-4">
                <textarea
                  autoFocus
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 min-h-[100px] outline-none focus:border-[#55acee] dark:focus:border-indigo-500 transition-colors resize-none shadow-sm"
                  value={tempNote}
                  onChange={(e) => setTempNote(e.target.value)}
                  placeholder="Specific requirements or shared goals..."
                />
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={handleCancelEdit} icon={X} className="text-[10px] py-1.5 px-3">Cancel</Button>
                  <Button onClick={handleSaveNote} icon={Save} className="text-[10px] py-1.5 px-4 bg-[#55acee] dark:bg-indigo-600 hover:bg-[#449bdd] dark:hover:bg-indigo-500 border-none">Save Changes</Button>
                </div>
              </div>
            ) : (
              <p className="text-slate-700 dark:text-slate-200 text-sm italic leading-relaxed">
                {selectedRes?.note ? `"${selectedRes.note}"` : "No special notes yet. Use them to set specific targets or shared rules."}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3 px-1">
             <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black text-white shadow-lg border border-white/10"
              style={{ backgroundColor: selectedRes ? getAuthor(selectedRes.authorId)?.color : '#ccc' }}
            >
              {selectedRes ? getAuthor(selectedRes.authorId)?.name.substring(0, 2).toUpperCase() : '??'}
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">Original Author</p>
              <p className="text-sm text-slate-600 dark:text-slate-300 font-bold">{selectedRes ? getAuthor(selectedRes.authorId)?.name : 'Unknown'}</p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};