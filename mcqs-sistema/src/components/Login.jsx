import React, { useState } from 'react';
import { API_BASE_URL } from '../config/api';

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsAuthenticating(true);
    setErrorMsg('');
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok) {
        onLogin(data.token, data.user);
      } else {
        setErrorMsg(data.error || 'Credenciales inválidas');
        setIsAuthenticating(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error de red. Asegúrese de que el servidor esté en línea.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-8 font-sans overflow-hidden select-none bg-slate-50 text-slate-900">
      {/* ========================================================================= */}
      {/* ULTRA-LUMINOUS WHITE ARCHITECTURAL BACKGROUND                             */}
      {/* ========================================================================= */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 transform scale-[1.01]"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1600585154526-990dced4db0d?q=80&w=2560&auto=format&fit=crop')`
        }}
      >
        {/* Luminous White Gradient Overlay & Specular Highlights */}
        <div className="absolute inset-0 bg-gradient-to-tr from-white/85 via-slate-50/70 to-white/80 backdrop-blur-[1px] pointer-events-none" />
        <div className="absolute -top-32 -left-32 w-[700px] h-[700px] bg-blue-400/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[700px] h-[700px] bg-amber-300/10 rounded-full blur-[150px] pointer-events-none" />
      </div>

      {/* ========================================================================= */}
      {/* FLOATING WHITE LUXURY CARD                                                */}
      {/* ========================================================================= */}
      <div className="relative z-10 w-full max-w-md bg-white/95 backdrop-blur-2xl rounded-2xl border border-white shadow-xl ring-1 ring-slate-200/80 p-6 sm:p-8 overflow-hidden text-slate-950 flex flex-col items-center">
        
        {/* Subtle Top Blue Accent Bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-cyan-400"></div>

        {/* Brand Emblem / Monogram Badge */}
        <div className="mb-4 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-2 relative group">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-blue-500/10 to-amber-500/10 opacity-70 blur-xs pointer-events-none"></div>
            <svg className="w-6 h-6 text-blue-600 relative z-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>

          {/* Luxury Executive Badge */}
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span>Sistema Ejecutivo • MCQS</span>
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mb-5 space-y-0.5">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950">
            Portal de <span className="text-blue-600">Acceso</span>
          </h1>
          <p className="text-xs font-semibold text-slate-500">
            Gestión de Cartas Fianza, Facturación & Archivo
          </p>
        </div>

        {/* Form */}
        <form className="w-full space-y-3.5" onSubmit={handleLoginSubmit}>
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-2.5 text-center animate-fadeIn">
              <p className="text-xs font-bold text-rose-700">{errorMsg}</p>
            </div>
          )}

          {/* Input: Correo Electrónico */}
          <div className="space-y-1">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 pl-0.5">
              Usuario / Correo Electrónico
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                </svg>
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 shadow-xs transition-all"
                placeholder="ejecutivo@empresa.com"
              />
            </div>
          </div>

          {/* Input: Contraseña */}
          <div className="space-y-1">
            <div className="flex justify-between items-center pl-0.5">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
                Contraseña de Seguridad
              </label>
              <a href="#" className="text-[10px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-wider">
                ¿Olvidaste tu clave?
              </a>
            </div>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-500/20 shadow-xs transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-1">
            <button 
              type="submit" 
              disabled={isAuthenticating}
              className="w-full py-2.5 px-4 flex justify-center items-center gap-2 rounded-xl text-xs font-bold tracking-wider uppercase transition-all duration-200 bg-slate-950 hover:bg-slate-900 text-white shadow-xs active:scale-[0.99] disabled:opacity-50"
            >
              {isAuthenticating ? (
                <div className="flex items-center gap-2">
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Verificando...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span>Ingresar al Sistema</span>
                  <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </form>

        {/* Security / Trust Footer */}
        <div className="mt-5 pt-4 border-t border-slate-100 w-full flex flex-col items-center gap-1 text-center">
          <div className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
            <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Conexión Segura Cifrada SSL</span>
          </div>
          <p className="text-[10px] font-bold tracking-wider uppercase text-slate-400">
            © {new Date().getFullYear()} MCQS-JCQ • Gestión Corporativa
          </p>
        </div>

      </div>
    </div>
  );
};

export default Login;
