import React from 'react';

export const Button = ({ 
  onClick, 
  children, 
  variant = 'primary', 
  className = '', 
  disabled = false,
  icon: Icon
}: any) => {
  const baseStyle = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all transform active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed text-sm sm:text-base";
  const variants = {
    primary: "bg-[#55acee] dark:bg-[#0084e8] hover:bg-[#449bdd] dark:hover:bg-[#0073cc] text-white shadow-lg shadow-indigo-900/10 dark:shadow-indigo-900/20",
    secondary: "bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 shadow-sm",
    danger: "bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100"
  };

  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`${baseStyle} ${variants[variant as keyof typeof variants]} ${className}`}
    >
      {Icon && <Icon size={18} />}
      {children}
    </button>
  );
};

export const Input = ({ value, onChange, placeholder, autoFocus, onKeyDown, label, type = "text", disabled = false }: any) => (
  <div className="w-full">
    {label && <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 mb-2 uppercase tracking-widest">{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoFocus={autoFocus}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-[#55acee] dark:focus:border-[#0084e8] focus:ring-4 focus:ring-indigo-500/10 text-slate-800 dark:text-slate-100 px-4 py-3 rounded-xl outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 disabled:opacity-50"
    />
  </div>
);

export const Modal = ({ isOpen, onClose, title, children }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-md rounded-2xl shadow-2xl p-6 relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-extrabold text-slate-800 dark:text-slate-100">{title}</h2>
          <button onClick={onClose} className="text-slate-400 dark:text-slate-500 hover:text-slate-800 dark:hover:text-slate-100 text-2xl leading-none">&times;</button>
        </div>
        <div className="text-slate-600 dark:text-slate-400 leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
};

export const Badge = ({ children, color }: { children: React.ReactNode, color?: string }) => (
  <span 
    className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-sm"
    style={{ backgroundColor: color || '#475569' }}
  >
    {children}
  </span>
);