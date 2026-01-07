import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Play, ShieldAlert, Plus, ArrowRight, Share2, 
  Trophy, Info, Home, Edit2, FileText, Sun, Moon, Palette
} from 'lucide-react';
import { 
  GameSession, User, CanvasElement
} from './types';
import * as Game from './services/gameService';
import { Button, Input, Modal } from './components/UI';
import { Board } from './components/Board';
import { BackgroundCanvas } from './components/BackgroundCanvas';
import { BackgroundToolbar } from './components/BackgroundToolbar';

export default function App() {
  // --- State ---
  const [session, setSession] = useState<GameSession | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark');
    }
    return true;
  });
  const [isBgEditing, setIsBgEditing] = useState(false);
  const [activeBrushColor, setActiveBrushColor] = useState('#0084e8');
  const [activeBrushSize, setActiveBrushSize] = useState(5);
  
  // UI State
  const [showRules, setShowRules] = useState(false);
  const [newSessionName, setNewSessionName] = useState('');
  const [numUsers, setNumUsers] = useState<string>('3');
  const [joinName, setJoinName] = useState('');
  const [newResolution, setNewResolution] = useState('');
  const [newResolutionNote, setNewResolutionNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [view, setView] = useState<'HOME' | 'CREATE' | 'JOIN' | 'LOBBY'>('HOME');

  // --- Effects ---

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    }
  }, [isDarkMode]);

  useEffect(() => {
    try {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        const loaded = Game.loadSession(hash);
        if (loaded) {
          setSession(loaded);
          setView('JOIN');
        }
      }
    } catch (e) {
      console.warn("Could not read location hash", e);
    }
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (session && e.key === `bingo_session_${session.id}` && e.newValue) {
        setSession(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [session]);

  // --- Actions ---

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const goHome = () => {
    setSession(null);
    setCurrentUser(null);
    setView('HOME');
    setJoinName('');
    setNewSessionName('');
    setValidationMsg(null);
    setIsBgEditing(false);
    
    try {
      window.history.replaceState(null, '', window.location.pathname);
    } catch(e) {}
  };

  const handleCreateSession = () => {
    const totalUsers = parseInt(numUsers);
    const valid = Game.validateConfig(totalUsers);
    if (!valid.valid) {
      setValidationMsg(valid.message || "Invalid setup");
      return;
    }
    
    if (!newSessionName || !joinName) {
      setValidationMsg("Fill in all fields to start.");
      return;
    }

    const newSession = Game.createSession(newSessionName, totalUsers, joinName);
    setSession(newSession);
    setCurrentUser(newSession.users[0]);
    setActiveBrushColor(newSession.users[0].color); // Default color to user's color
    
    try {
      window.location.hash = newSession.id;
    } catch (e) {}
    
    setView('LOBBY');
  };

  const handleJoinSession = () => {
    if (!session || !joinName) return;
    
    const existing = session.users.find(u => u.name.toLowerCase() === joinName.toLowerCase());
    if (existing) {
      setCurrentUser(existing);
      setActiveBrushColor(existing.color);
    } else {
      const updated = Game.joinSession(session, joinName);
      setSession(updated);
      const me = updated.users.find(u => u.name === joinName);
      if (me) {
        setCurrentUser(me);
        setActiveBrushColor(me.color);
      }
    }
    setView('LOBBY');
  };

  const handleAddResolution = () => {
    if (!session || !currentUser || !newResolution.trim()) return;
    const updated = Game.addResolution(session, newResolution, currentUser.id, newResolutionNote.trim() || undefined);
    setSession(updated);
    setNewResolution('');
    setNewResolutionNote('');
    setShowNoteInput(false);
  };

  const handleUpdateNote = (resId: string, note: string) => {
    if (!session) return;
    const updated = Game.updateResolutionNote(session, resId, note);
    setSession(updated);
  };

  const handleUpdateBackground = (elements: CanvasElement[]) => {
    if (!session) return;
    const updated = Game.updateBackground(session, elements);
    setSession(updated);
  };

  const handleClearBackground = () => {
    if (!session || !confirm("Clear all artistic hard work?")) return;
    const updated = Game.clearBackground(session);
    setSession(updated);
  };

  const handleAddTextElement = () => {
    const text = prompt("Enter text to add to background:");
    if (!text || !session || !currentUser) return;
    const newEl: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'text',
      x: Math.random() * (window.innerWidth - 300) + 150,
      y: Math.random() * (window.innerHeight - 300) + 150,
      content: text,
      color: activeBrushColor,
      authorId: currentUser.id
    };
    handleUpdateBackground([...session.backgroundElements, newEl]);
  };

  const handleAddImageElement = () => {
    const url = prompt("Enter Image URL or Paste Data URL:");
    if (!url || !session || !currentUser) return;
    const newEl: CanvasElement = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'image',
      x: Math.random() * (window.innerWidth - 300) + 150,
      y: Math.random() * (window.innerHeight - 300) + 150,
      content: url,
      width: 200,
      height: 200,
      authorId: currentUser.id
    };
    handleUpdateBackground([...session.backgroundElements, newEl]);
  };

  const handleToggleCheck = (resId: string) => {
    if (!session || !currentUser) return;
    const updated = Game.toggleCheck(session, currentUser.id, resId);
    setSession(updated);
  };

  const handleFinalize = () => {
    if (!session) return;
    const updated = Game.finalizeBoard(session);
    setSession(updated);
  };

  const handleRevertToEdit = () => {
    if (!session) return;
    if (confirm("Unlock board for editing?")) {
      const updated = Game.revertToEdit(session);
      setSession(updated);
    }
  };

  const copyLink = () => {
    try {
      const baseUrl = window.location.href.split('#')[0];
      const url = `${baseUrl}#${session?.id}`;
      navigator.clipboard.writeText(url);
      alert("Link copied!");
    } catch (e) {
      if (session?.id) {
        navigator.clipboard.writeText(session.id);
        alert("ID copied!");
      }
    }
  };

  // --- Derived State ---
  
  const totalSquares = session ? (session.gridSize * session.gridSize) - 1 : 0;
  const currentResolutionsCount = session?.resolutions.filter(r => !r.isFree).length || 0;
  const isBoardFull = currentResolutionsCount >= totalSquares;
  
  const leaderboard = useMemo(() => {
    if (!session) return [];
    return session.users.map(u => {
      const count = (session.checks[u.id] || []).length;
      return { ...u, score: count };
    }).sort((a, b) => b.score - a.score);
  }, [session]);

  // --- UI Components ---
  const ThemeToggle = () => (
    <button 
      onClick={toggleTheme}
      className="fixed top-6 right-6 z-[60] p-3 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl text-slate-600 dark:text-slate-100 transition-all hover:scale-110 active:scale-95"
      aria-label="Toggle Theme"
    >
      {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );

  const CustomizeToggle = () => (
    <button 
      onClick={() => setIsBgEditing(!isBgEditing)}
      className={`fixed top-20 right-6 z-[60] p-3 rounded-full border shadow-xl transition-all hover:scale-110 active:scale-95 ${isBgEditing ? 'bg-[#55acee] text-white border-[#55acee]' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-100'}`}
      aria-label="Customize Background"
      title="Customize Background"
    >
      <Palette size={20} />
    </button>
  );

  // --- Render ---

  if (view === 'HOME') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <ThemeToggle />
        <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block p-6 rounded-[2.5rem] bg-[#55acee] dark:bg-[#0084e8] shadow-2xl shadow-indigo-600/10 dark:shadow-indigo-600/20 mb-8 border border-white/20">
            <Trophy size={64} className="text-white" />
          </div>
          <h1 className="text-6xl md:text-9xl font-extrabold tracking-tighter text-slate-900 dark:text-slate-100">
            Bingo<span className="text-[#a29bfe] dark:text-[#7772c2]">.</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg md:text-xl max-w-lg mx-auto font-medium">
            Shared goals. Real progress. Gamify your year with friends.
          </p>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs animate-in fade-in slide-in-from-bottom-8 duration-700 delay-150">
          <Button onClick={() => setView('CREATE')} icon={Plus}>New Session</Button>
          <Button variant="secondary" onClick={() => setView('JOIN')} icon={Users}>Join Session</Button>
          <Button variant="ghost" onClick={() => setShowRules(true)} icon={Info}>How it Works</Button>
        </div>

        <Modal isOpen={showRules} onClose={() => setShowRules(false)} title="Game Rules">
          <ul className="space-y-5 text-slate-600 dark:text-slate-400 text-sm font-medium">
            <li className="flex gap-4"><span className="text-[#55acee] dark:text-[#0084e8] font-bold shrink-0 text-base">01.</span> Start a session and share the unique link with your group.</li>
            <li className="flex gap-4"><span className="text-[#55acee] dark:text-[#0084e8] font-bold shrink-0 text-base">02.</span> Collaborate on goals. Resolutions fill the board in random slots.</li>
            <li className="flex gap-4"><span className="text-[#55acee] dark:text-[#0084e8] font-bold shrink-0 text-base">03.</span> When the board is full, "Lock" it to shuffle and start playing.</li>
            <li className="flex gap-4"><span className="text-[#55acee] dark:text-[#0084e8] font-bold shrink-0 text-base">04.</span> Tap squares as you complete them to climb the live leaderboard.</li>
          </ul>
        </Modal>
      </div>
    );
  }

  if (view === 'CREATE') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
        <ThemeToggle />
        <div className="absolute top-8 left-8">
          <Button variant="ghost" onClick={goHome} icon={Home}>Home</Button>
        </div>
        <div className="w-full max-w-md space-y-10">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">Create Board</h2>
            <p className="text-slate-500 mt-2 font-medium">Set the rules for your squad.</p>
          </div>
          
          <div className="space-y-6 bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
            <Input 
              label="Session Name" 
              placeholder="e.g. 2025 Hustle" 
              value={newSessionName} 
              onChange={(e: any) => setNewSessionName(e.target.value)} 
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input 
                label="Your Alias" 
                placeholder="Name" 
                value={joinName} 
                onChange={(e: any) => setJoinName(e.target.value)} 
              />
               <Input 
                label="Squad Size" 
                type="number"
                placeholder="3" 
                value={numUsers} 
                onChange={(e: any) => setNumUsers(e.target.value)} 
              />
            </div>

            {validationMsg && (
              <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl flex items-start gap-3">
                <ShieldAlert size={16} className="mt-0.5 shrink-0 text-red-500"/>
                {validationMsg}
              </div>
            )}
          </div>

          <div className="flex gap-4">
            <Button variant="secondary" className="flex-1" onClick={goHome}>Cancel</Button>
            <Button className="flex-1" onClick={handleCreateSession}>Create</Button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'JOIN') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950 relative transition-colors duration-300">
        <ThemeToggle />
        <div className="absolute top-8 left-8">
           <Button variant="ghost" onClick={goHome} icon={Home}>Home</Button>
        </div>
        <div className="w-full max-w-md space-y-10">
          <div className="text-center">
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100">Join In</h2>
            {session && <p className="text-[#55acee] dark:text-indigo-400 font-bold mt-2 uppercase tracking-[0.2em] text-[10px]">{session.name}</p>}
          </div>
          
          {!session ? (
            <div className="bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center shadow-xl">
              <Input 
                placeholder="Paste Session ID..." 
                value={joinName} 
                onChange={(e: any) => {
                  const val = e.target.value;
                  setJoinName(val);
                  const s = Game.loadSession(val);
                  if (s) {
                    setSession(s);
                    setJoinName('');
                  }
                }} 
              />
              <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 mt-6 uppercase tracking-widest">Connect with your friends</p>
            </div>
          ) : (
            <div className="space-y-6 bg-white dark:bg-slate-900/50 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl">
              <Input 
                label="Your Name" 
                placeholder="How should we call you?" 
                value={joinName} 
                onChange={(e: any) => setJoinName(e.target.value)} 
                autoFocus
              />
              <Button className="w-full" onClick={handleJoinSession}>Enter Session</Button>
            </div>
          )}
           <Button variant="ghost" className="w-full" onClick={goHome}>Back to Home</Button>
        </div>
      </div>
    );
  }

  if (!session || !currentUser) return null;

  const isEditMode = session.phase === 'EDIT';

  return (
    <div className="min-h-screen max-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col md:flex-row text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      <ThemeToggle />
      <CustomizeToggle />

      {isBgEditing && (
        <BackgroundToolbar 
          onAddText={handleAddTextElement}
          onAddImage={handleAddImageElement}
          onClear={handleClearBackground}
          onClose={() => setIsBgEditing(false)}
          activeColor={activeBrushColor}
          onColorChange={setActiveBrushColor}
          activeSize={activeBrushSize}
          onSizeChange={setActiveBrushSize}
        />
      )}
      
      {/* Sidebar */}
      <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-md border-b md:border-b-0 md:border-r border-slate-200 dark:border-slate-800 p-6 md:w-80 flex flex-col gap-8 shrink-0 z-10 shadow-2xl">
        <div>
          <div className="flex items-center justify-between mb-8">
            <Button 
               variant="ghost" 
               className="px-0 py-1 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 justify-start gap-1 font-bold text-[10px] uppercase tracking-widest" 
               onClick={goHome} 
               icon={Home}
            >
              Home
            </Button>
             {!isEditMode && (
                <Button 
                  variant="ghost" 
                  className="px-2 py-1 text-[#55acee] dark:text-indigo-400 hover:text-[#449bdd] dark:hover:text-indigo-300 justify-start gap-1 text-[10px] font-bold uppercase tracking-widest"
                  onClick={handleRevertToEdit}
                  icon={Edit2}
                >
                  Edit
                </Button>
             )}
          </div>

          <h1 className="text-xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#55acee] dark:bg-indigo-500 shadow-lg shadow-indigo-500/40 animate-pulse"/>
            {session.name}
          </h1>
          
          <div className="mt-6 bg-slate-100/40 dark:bg-slate-950/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
             <div className="flex items-center justify-between gap-2 text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-widest mb-3">
                <span>Session ID</span>
                <code className="bg-white dark:bg-slate-900 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[#55acee] dark:text-indigo-400 font-mono select-all text-[9px]">
                  {session.id}
                </code>
             </div>
             <Button 
                variant="secondary" 
                className="w-full text-[10px] py-2 h-auto" 
                onClick={copyLink}
                icon={Share2}
             >
               Copy Link
             </Button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="flex-1 overflow-auto pr-2">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.25em] mb-6">Leaderboard</h3>
          <div className="space-y-1.5">
            {leaderboard.map((u, idx) => (
              <div key={u.id} className={`flex items-center gap-3 p-3 rounded-2xl transition-all ${u.id === currentUser.id ? 'bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-lg' : 'hover:bg-slate-100/60 dark:hover:bg-slate-800/40'}`}>
                <div className="font-bold text-slate-300 dark:text-slate-700 w-4 text-[10px] italic">{idx + 1}</div>
                <div 
                  className="w-9 h-9 rounded-2xl flex items-center justify-center text-[11px] font-black text-white shadow-xl border border-white/20 dark:border-slate-900"
                  style={{ backgroundColor: u.color }}
                >
                  {u.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{u.name} {u.id === currentUser.id && ' (Me)'}</div>
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500">{u.score} checked</div>
                </div>
                {idx === 0 && u.score > 0 && <Trophy size={14} className="text-amber-500" />}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-4">
          {isEditMode ? (
             <div className="text-[10px] font-bold text-slate-400 dark:text-slate-600 text-center uppercase tracking-widest">
               Filling Board... <br/>
               <span className={`text-[13px] ${isBoardFull ? 'text-[#55acee] dark:text-indigo-400 font-black' : 'text-slate-800 dark:text-slate-300'}`}>
                 {currentResolutionsCount} / {totalSquares}
               </span>
             </div>
          ) : (
             <div className="text-[10px] font-bold text-[#55acee] dark:text-indigo-500 text-center uppercase tracking-[0.2em] animate-pulse">
               Active Session
             </div>
          )}
           <Button variant="danger" className="w-full text-[10px] py-2.5 h-auto uppercase tracking-widest" onClick={goHome}>
             Leave Session
           </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <BackgroundCanvas 
          elements={session.backgroundElements}
          isEditing={isBgEditing}
          onElementsChange={handleUpdateBackground}
          userId={currentUser.id}
          userColor={currentUser.color}
          brushColor={activeBrushColor}
          brushSize={activeBrushSize}
        />

        {/* Header (Minimal) */}
        <div className="px-6 py-4 flex justify-between items-center border-b border-slate-200 dark:border-slate-900/50 z-10 bg-white/40 dark:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
            <div className="space-y-0.5">
              <h2 className="text-lg md:text-xl font-black text-slate-900 dark:text-slate-100">
                {isEditMode ? 'Building Grid' : 'Bingo Time'}
              </h2>
            </div>
            {!isEditMode && (
              <div className="bg-white dark:bg-slate-900 px-4 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg flex items-center gap-3">
                <span className="text-[#55acee] dark:text-indigo-500 font-black text-xl">{session.checks[currentUser.id]?.length || 0}</span>
                <span className="text-slate-400 dark:text-slate-600 text-[8px] font-black uppercase tracking-widest leading-none">Checks<br/>Met</span>
              </div>
            )}
        </div>

        {/* Board Display Area (Constrained) */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 flex items-center justify-center z-10">
          <div className="w-full h-full max-h-[calc(100vh-280px)] flex items-center justify-center">
            <Board 
              session={session} 
              currentUserId={currentUser.id} 
              isInteractive={!isEditMode && !isBgEditing}
              onSquareClick={handleToggleCheck}
              onUpdateNote={handleUpdateNote}
            />
          </div>
        </div>

        {/* Input Area (Only in Edit Mode) */}
        {isEditMode && (
          <div className="p-4 sm:p-6 bg-white/90 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 shadow-2xl shrink-0 z-20">
            <div className="max-w-3xl mx-auto space-y-3">
              <div className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Input 
                    value={newResolution}
                    onChange={(e: any) => setNewResolution(e.target.value)}
                    onKeyDown={(e: any) => e.key === 'Enter' && handleAddResolution()}
                    placeholder={isBoardFull ? "Full!" : "Goal (e.g. Visit 3 new cities)"}
                    disabled={isBoardFull}
                    autoFocus
                  />
                  {showNoteInput && (
                    <Input 
                      value={newResolutionNote}
                      onChange={(e: any) => setNewResolutionNote(e.target.value)}
                      onKeyDown={(e: any) => e.key === 'Enter' && handleAddResolution()}
                      placeholder="Special notes or specific requirements..."
                      disabled={isBoardFull}
                    />
                  )}
                </div>
                <div className="flex flex-col gap-2 shrink-0">
                   {!showNoteInput && !isBoardFull && (
                    <Button 
                      onClick={() => setShowNoteInput(true)} 
                      variant="ghost"
                      className="text-[9px] px-2 py-1 h-auto uppercase tracking-widest"
                      icon={FileText}
                    >
                      + Note
                    </Button>
                  )}
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleAddResolution} 
                      disabled={isBoardFull || !newResolution.trim()}
                      icon={ArrowRight}
                      className="shrink-0 p-3"
                    />
                    {isBoardFull && (
                      <Button 
                        onClick={handleFinalize} 
                        className="animate-pulse bg-[#55acee] dark:bg-emerald-600 hover:bg-[#449bdd] dark:hover:bg-emerald-500 border-none px-4"
                        icon={Play}
                      >
                        Start Game
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}