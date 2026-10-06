import React from 'react';

const Sidebar = ({ currentView, setCurrentView, onLogout, isCollapsed, onToggleCollapse }) => {
  const navItems = [
    { 
      id: 'dashboard', 
      label: 'Dashboard',
      accentColor: 'from-amber-400 to-amber-600',
      activeText: 'text-amber-400',
      iconPodBg: 'bg-amber-500/10 text-amber-700 border-amber-400/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
      )
    },
    { 
      id: 'expedientes', 
      label: 'Empresas', 
      accentColor: 'from-blue-500 to-indigo-600',
      activeText: 'text-blue-400',
      iconPodBg: 'bg-blue-500/10 text-blue-700 border-blue-400/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      )
    },
    { 
      id: 'cartas-fianzas', 
      label: 'Cartas Fianzas',
      accentColor: 'from-amber-500 to-yellow-600',
      activeText: 'text-amber-300',
      iconPodBg: 'bg-amber-500/10 text-amber-700 border-amber-400/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    { 
      id: 'renovaciones', 
      label: 'Renovaciones',
      accentColor: 'from-emerald-400 to-teal-600',
      activeText: 'text-emerald-400',
      iconPodBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-400/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H12" />
        </svg>
      )
    },
    { 
      id: 'facturas', 
      label: 'Facturas',
      accentColor: 'from-purple-500 to-indigo-600',
      activeText: 'text-purple-300',
      iconPodBg: 'bg-purple-500/10 text-purple-700 border-purple-400/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2zM10 8.5a.5.5 0 11-1 0 .5.5 0 011 0zm5 5a.5.5 0 11-1 0 .5.5 0 011 0z" />
        </svg>
      )
    },
    { 
      id: 'cargos', 
      label: 'Cargos',
      accentColor: 'from-cyan-500 to-blue-600',
      activeText: 'text-cyan-400',
      iconPodBg: 'bg-cyan-500/10 text-cyan-700 border-cyan-400/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      )
    },
    { 
      id: 'informes', 
      label: 'Informes',
      accentColor: 'from-sky-400 to-blue-600',
      activeText: 'text-sky-300',
      iconPodBg: 'bg-sky-500/10 text-sky-700 border-sky-400/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    { 
      id: 'tramites-huanuco', 
      label: 'GOREHCO Trámites',
      accentColor: 'from-blue-600 to-sky-500',
      activeText: 'text-blue-300',
      iconPodBg: 'bg-blue-600/10 text-blue-700 border-blue-500/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      )
    },
    { 
      id: 'consultas-dni-ruc', 
      label: 'Consulta DNI / RUC',
      accentColor: 'from-emerald-500 to-teal-700',
      activeText: 'text-emerald-400',
      iconPodBg: 'bg-emerald-500/10 text-emerald-700 border-emerald-400/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
        </svg>
      )
    },
    { 
      id: 'ajustes', 
      label: 'Ajustes',
      accentColor: 'from-slate-400 to-slate-600',
      activeText: 'text-slate-200',
      iconPodBg: 'bg-slate-500/10 text-slate-700 border-slate-400/30',
      icon: (
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      )
    },
  ];

  return (
    <div className="w-full h-full bg-white/90 backdrop-blur-xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5 rounded-2xl flex flex-col justify-between transition-all duration-300 overflow-hidden relative select-none text-slate-900">
      
      {/* Top Brand & Toggle Header */}
      <div className={`p-3.5 flex items-center border-b border-slate-100 relative z-10 transition-all ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!isCollapsed ? (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs border border-amber-300">
              ✨
            </div>
            <div>
              <h1 className="text-xs font-black text-slate-950 tracking-[0.16em] uppercase leading-none">
                MCQS<span className="text-blue-600 font-black">-JCQ</span>
              </h1>
              <p className="text-[9px] font-extrabold tracking-[0.2em] text-slate-400 uppercase mt-0.5">
                Financial System
              </p>
            </div>
          </div>
        ) : (
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-500 text-slate-950 flex items-center justify-center font-black text-sm shadow-xs" title="MCQS-JCQ Financial System">
            ✨
          </div>
        )}

        {/* Toggle Button */}
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title={isCollapsed ? "Expandir Menú" : "Colapsar a Iconos"}
            className={`w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-xs border border-slate-200 transition-all active:scale-95 ${isCollapsed ? 'hidden' : 'flex'}`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        )}
      </div>
      
      {/* Nav items */}
      <nav className="flex-1 px-2.5 py-3 space-y-1 overflow-y-auto custom-scrollbar relative z-10">
        {navItems.map(item => {
          const isActive = currentView === item.id;

          return (
            <a 
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => {
                e.preventDefault();
                setCurrentView(item.id);
              }}
              className={`relative w-full flex items-center rounded-xl transition-all duration-150 group ${
                isCollapsed 
                  ? 'justify-center p-2' 
                  : 'gap-2.5 px-3 py-2'
              } ${
                isActive 
                  ? 'bg-slate-950 text-white shadow-md border border-slate-800' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 border border-slate-100 hover:border-slate-200 shadow-2xs'
              }`}
            >
              {/* Icon Pod */}
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 shadow-2xs border ${
                isActive 
                  ? 'bg-white/20 text-white border-white/20 scale-105' 
                  : `${item.iconPodBg} group-hover:scale-105`
              }`}>
                {React.cloneElement(item.icon, { className: 'w-4 h-4' })}
              </div>

              {/* High-Contrast Label */}
              {!isCollapsed && (
                <span className={`truncate text-xs font-bold tracking-wide uppercase ${isActive ? 'text-white' : 'text-slate-700 group-hover:text-slate-950'}`}>
                  {item.label}
                </span>
              )}

              {/* Active Indicator Dot */}
              {!isCollapsed && isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,1)]"></span>
              )}

              {/* Tooltip (When Collapsed) */}
              {isCollapsed && (
                <div className="absolute left-full ml-2.5 px-3 py-1 bg-slate-950 text-white text-[10px] font-bold rounded-lg shadow-xl border border-slate-700 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>{item.label}</span>
                </div>
              )}
            </a>
          );
        })}
      </nav>
      
      {/* Bottom Section */}
      <div className="p-2.5 border-t border-slate-100 bg-slate-50/50 relative z-10 flex flex-col gap-1.5">
        {onLogout && (
          <button
            onClick={onLogout}
            title={isCollapsed ? "Cerrar Sesión" : ""}
            className={`w-full flex items-center rounded-xl transition-all duration-150 group bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-700 border border-slate-200 hover:border-rose-200 shadow-2xs ${
              isCollapsed ? 'justify-center p-2 relative' : 'gap-2.5 px-3 py-2 text-xs font-bold uppercase tracking-wider'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 group-hover:scale-105 transition-transform">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.3} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            {!isCollapsed && <span>Cerrar Sesión</span>}

            {isCollapsed && (
              <div className="absolute left-full ml-2.5 px-3 py-1 bg-rose-950 text-rose-100 text-[10px] font-bold rounded-lg shadow-xl border border-rose-800 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 uppercase tracking-wider">
                Cerrar Sesión
              </div>
            )}
          </button>
        )}
        {/* Expand button in collapsed mode */}
        {isCollapsed && onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title="Expandir Menú"
            className="w-full flex items-center justify-center p-2 rounded-xl bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 transition-all active:scale-95 shadow-xs"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {!isCollapsed && (
          <div className="flex items-center justify-center pt-1 text-[9px] font-mono text-slate-400 tracking-wider uppercase font-bold">
            MCQS • Light Luxury Edition
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;

