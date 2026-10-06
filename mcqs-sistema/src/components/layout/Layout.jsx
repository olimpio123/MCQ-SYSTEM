import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

const Layout = ({ children, onLogout, currentView, setCurrentView }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="min-h-screen relative flex font-sans text-slate-900 overflow-hidden select-none bg-slate-50">
      {/* ========================================================================= */}
      {/* 1. ULTRA-LUMINOUS WHITE LUXURY ARCHITECTURAL BACKGROUND                   */}
      {/* ========================================================================= */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-700 transform scale-[1.01]"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2560&auto=format&fit=crop')" 
        }}
      >
        {/* Luminous White Ambient Lighting & Soft Sunlight Glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/85 via-slate-50/70 to-white/80 backdrop-blur-[1px] pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-300/10 rounded-full blur-[140px] pointer-events-none"></div>
      </div>

      {/* Floating Toggle Sidebar button */}
      <button
        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        title={isSidebarCollapsed ? "Expandir menú completo" : "Colapsar a barra de iconos"}
        className="fixed bottom-6 left-6 z-40 w-12 h-12 rounded-full bg-white hover:bg-slate-50 text-slate-800 hover:text-blue-600 flex items-center justify-center shadow-[0_10px_30px_rgba(0,0,0,0.12)] hover:scale-110 active:scale-95 transition-all duration-300 border border-slate-200/80 backdrop-blur-xl group ring-1 ring-slate-200"
      >
        {!isSidebarCollapsed ? (
          <svg className="w-5 h-5 text-slate-800 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
        ) : (
          <svg className="w-5 h-5 text-slate-800 group-hover:text-blue-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        )}
      </button>

      {/* ========================================================================= */}
      {/* 2. SPATIAL FLOATING WINDOW CONTAINERS (CRISP PURE WHITE CRYSTAL GLASS)    */}
      {/* ========================================================================= */}
      <div className="relative z-20 flex w-full h-screen overflow-hidden p-2.5 md:p-3.5 gap-3.5">
        {/* Floating Sidebar Window */}
        <div 
          className="transition-all duration-300 ease-in-out flex-shrink-0"
          style={{ width: isSidebarCollapsed ? '4.75rem' : '16rem' }}
        >
          <Sidebar 
            currentView={currentView} 
            setCurrentView={setCurrentView} 
            onLogout={onLogout} 
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          />
        </div>

        {/* Floating Main View Window */}
        <div className="flex-1 flex flex-col h-full bg-white/90 backdrop-blur-xl rounded-2xl border border-slate-200/80 shadow-sm ring-1 ring-slate-900/5 overflow-hidden transition-all duration-300 text-slate-900">
          <Topbar onLogout={onLogout} currentView={currentView} setCurrentView={setCurrentView} />
          <main className="flex-1 p-4 md:p-6 overflow-auto custom-scrollbar">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;
