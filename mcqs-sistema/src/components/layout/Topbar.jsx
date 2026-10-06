import React from 'react';
import { Search, Command } from 'lucide-react';

const Topbar = ({ onLogout }) => {
  const userData = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : null;
  const userRole = userData ? userData.rol : 'Admin';
  const userName = userData && userData.nombre ? userData.nombre : 'Sajib';
  
  const userInitials = userData && userData.nombre 
    ? userData.nombre.substring(0, 2).toUpperCase() 
    : 'AD';

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-6 border-b border-slate-100 bg-white/70 backdrop-blur-md transition-colors w-full z-10 relative text-slate-900">
      {/* Left side: Welcome greeting */}
      <div className="flex items-center space-x-1.5">
        <h2 className="text-xs sm:text-sm font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
          Bienvenido, <span className="text-blue-600 font-black">{userName}</span> <span>👋</span>
        </h2>
      </div>

      {/* Middle: Search pill */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-6 group">
        <div className="w-full relative flex items-center">
          <div className="absolute left-3 text-slate-400 group-focus-within:text-slate-700 transition-colors pointer-events-none">
            <Search size={15} strokeWidth={2.2} />
          </div>
          <input 
            type="text" 
            placeholder="Buscar en el sistema..."
            className="w-full bg-slate-50 border border-slate-200/80 rounded-full pl-9 pr-12 py-1.5 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-slate-300 focus:ring-2 focus:ring-slate-100 transition-all shadow-2xs"
          />
          <div className="absolute right-2.5 flex items-center pointer-events-none">
             <kbd className="hidden lg:inline-flex items-center gap-0.5 bg-white border border-slate-200 text-slate-400 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider font-sans">
               <Command size={10} strokeWidth={2.5} /> K
             </kbd>
          </div>
        </div>
      </div>

      {/* Right side: Notifications & User Profile */}
      <div className="flex items-center space-x-2.5">
        {/* Notification Bell */}
        <button 
          title="Notificaciones"
          className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-slate-600 hover:text-blue-600 transition-all shadow-2xs"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        {/* User Card Capsule */}
        <div className="flex items-center space-x-2 bg-slate-50/80 pl-1.5 pr-3 py-1 rounded-xl border border-slate-200/80 shadow-2xs transition-all hover:border-slate-300">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-[10px] shadow-xs">
            {userInitials}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-900 font-extrabold tracking-tight leading-none">
              {userName}
            </span>
            <span className="text-[9px] text-slate-400 uppercase font-extrabold tracking-wider leading-none mt-0.5">
              {userRole}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
