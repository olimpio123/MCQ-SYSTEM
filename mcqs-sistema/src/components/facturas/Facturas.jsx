import React from 'react';
import { API_BASE_URL } from '../../config/api';

const Facturas = ({ onOpenEmpresa }) => {
  const [empresas, setEmpresas] = React.useState([]);
  const [showModal, setShowModal] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [isSearching, setIsSearching] = React.useState(false);
  const [recientes, setRecientes] = React.useState([]);
  const [dashboardData, setDashboardData] = React.useState({
    total: 0,
    monto_total: 0,
    observadas: 0,
    emitidas_mes: 0
  });

  React.useEffect(() => {
    fetch(`${API_BASE_URL}/api/empresas`)
      .then(res => res.json())
      .then(data => setEmpresas(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));

    fetch(`${API_BASE_URL}/api/facturas/dashboard`)
      .then(res => res.json())
      .then(data => {
        if (data.recientes) setRecientes(data.recientes);
        if (data.kpis) setDashboardData(data.kpis);
      })
      .catch(err => console.error(err));
  }, []);

  React.useEffect(() => {
    if (searchTerm.trim().length > 0) {
      setIsSearching(true);
      const delayDebounceFn = setTimeout(() => {
        fetch(`${API_BASE_URL}/api/facturas?search=${encodeURIComponent(searchTerm)}`)
          .then(res => res.json())
          .then(data => {
            const uniqueData = data.filter(f => f.numero !== f.numero_fianza);
            setSearchResults(uniqueData);
            setIsSearching(false);
          })
          .catch(err => {
            console.error(err);
            setIsSearching(false);
          });
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  return (
    <div className="w-full space-y-4 pb-8 font-sans select-none text-slate-900">
      
      {/* ========================================================================= */}
      {/* 1. TOP 4 CRISP WHITE KPI CARDS                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-950 leading-none">{dashboardData.total}</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total Facturas</p>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <span className="text-sm font-black font-mono">S/</span>
            </div>
            <div>
              <h4 className="text-lg font-black text-slate-950 leading-none font-mono truncate max-w-[140px]">
                S/ {dashboardData.monto_total > 1000000 ? (dashboardData.monto_total / 1000000).toFixed(2) + 'M' : parseFloat(dashboardData.monto_total || 0).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
              </h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Monto Facturado</p>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-950 leading-none">{dashboardData.emitidas_mes}</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Nuevas Este Mes</p>
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-950 leading-none">{dashboardData.observadas}</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Observadas</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOOLBAR                                                                */}
      {/* ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950 tracking-wide uppercase">Gestión de Facturas</h2>
            <p className="text-xs text-slate-500 font-semibold">Comprobantes por consorcio y notas de crédito</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Buscar empresa o factura..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-slate-950 text-xs font-semibold pl-9 pr-7 py-2 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white placeholder-slate-400 transition-all shadow-xs"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-950 font-bold cursor-pointer text-xs"
              >
                ✕
              </button>
            )}
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 active:scale-95 border border-slate-800 cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nueva Empresa</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. RECENT INVOICES & SEARCH RESULTS                                       */}
      {/* ========================================================================= */}
      {searchTerm.trim().length > 0 ? (
        <div className="space-y-4 animate-fadeIn">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {isSearching ? 'Buscando...' : `Resultados (${searchResults.length})`}
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {searchResults.map(factura => (
              <div 
                key={factura.id}
                onClick={() => {
                  const empresaAsociada = empresas.find(e => e.nombre === factura.empresa);
                  if (empresaAsociada) onOpenEmpresa(empresaAsociada);
                }}
                className="group bg-white border border-slate-200/80 p-4 rounded-2xl shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-600 font-mono font-bold text-xs sm:text-sm">{factura.numero}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-md ${
                      factura.observada ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {factura.observada ? 'Observada' : 'Válida'}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-950 uppercase truncate mb-1.5 group-hover:text-blue-600 transition-colors">{factura.empresa}</p>
                </div>
                <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-semibold">{factura.tipo_fianza || 'Fianza'}</span>
                  <span className="font-mono font-bold text-slate-950">S/ {parseFloat(factura.monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Facturas Recientemente Añadidas */}
          {recientes && recientes.length > 0 && (
            <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">
                  Facturas Recientes
                </h3>
                <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full shadow-xs">
                  {recientes.length} Registros
                </span>
              </div>
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                      <th className="py-2 px-3">N° FACTURA</th>
                      <th className="py-2 px-3">EMPRESA</th>
                      <th className="py-2 px-3">TIPO FIANZA</th>
                      <th className="py-2 px-3 text-right">MONTO</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-800 font-semibold">
                    {recientes.map((factura, index) => (
                      <tr key={index} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                        <td className="py-2 px-3 font-mono font-bold text-blue-600">{factura.numero}</td>
                        <td className="py-2 px-3 font-bold text-slate-950">{factura.empresa || 'No asignado'}</td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border border-slate-200">
                            {factura.tipo_fianza || 'N/A'}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-950">
                          {factura.moneda === 'USD' ? '$' : 'S/'} {parseFloat(factura.monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grid de Empresas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Empresas en Cartera ({empresas.length})
              </h3>
              <span className="text-[11px] font-semibold text-slate-400">
                Selecciona una empresa para gestionar sus facturas
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
              {empresas.map((empresa) => {
                const countFacturas = empresa.facturasActivas || 0;
                const countFianzas = empresa.fianzasActivas || 0;

                return (
                  <div 
                    key={empresa.id}
                    onClick={() => onOpenEmpresa(empresa)}
                    className="group bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 border border-slate-200/80 hover:border-blue-500 shadow-xs hover:shadow-md flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Header Row */}
                      <div className="flex justify-between items-center mb-2.5">
                        <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border shadow-xs ${
                          countFacturas > 0 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-slate-100 text-slate-500 border-slate-200'
                        }`}>
                          {countFacturas > 0 && <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-600 mr-1 animate-pulse"></span>}
                          {countFacturas} {countFacturas === 1 ? 'Factura' : 'Facturas'}
                        </span>
                      </div>

                      {/* Empresa Name */}
                      <h4 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-wide leading-snug line-clamp-2 group-hover:text-blue-600 transition-colors">
                        {empresa.nombre}
                      </h4>

                      {/* Information Chips / Status Pill */}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {empresa.ruc && (
                          <span className="bg-slate-50 text-slate-600 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md border border-slate-200">
                            RUC: {empresa.ruc}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          countFacturas > 0 
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                            : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {countFacturas > 0 ? 'Con Facturación' : 'Sin Emitir'}
                        </span>
                        {countFianzas > 0 && (
                          <span className="bg-blue-50/60 text-blue-800 text-[10px] font-semibold px-2 py-0.5 rounded-md border border-blue-100">
                            🛡️ {countFianzas} {countFianzas === 1 ? 'Fianza' : 'Fianzas'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Bottom Action Strip */}
                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[11px] uppercase font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                      <span className="tracking-wider">Abrir Facturación</span>
                      <div className="w-5 h-5 rounded-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center transition-all shadow-xs border border-slate-200 group-hover:border-blue-600">
                        <span className="text-[10px] font-bold">→</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Empresa */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity" onClick={() => setShowModal(false)}></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-slate-900 flex flex-col animate-fadeIn">
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Nueva Empresa</h3>
              <button onClick={() => setShowModal(false)} className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-950 flex items-center justify-center text-xs font-bold border border-slate-200 cursor-pointer">✕</button>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Nombre de la Empresa o Consorcio</label>
                <input 
                  type="text" 
                  id="nombreNuevaEmpresa"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white shadow-xs uppercase" 
                  placeholder="Ej. CONSTRUCTORA ABC..." 
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      document.getElementById('btnCrearEmpresa').click();
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center space-x-2">
              <button onClick={() => setShowModal(false)} className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-950 uppercase tracking-wider cursor-pointer">Cancelar</button>
              <button 
                id="btnCrearEmpresa"
                onClick={async () => {
                  const nombre = document.getElementById('nombreNuevaEmpresa').value;
                  if (!nombre) return alert('Por favor, ingresa el nombre.');
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/empresas`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ nombre })
                    });
                    if (res.ok) {
                      setShowModal(false);
                      fetch(`${API_BASE_URL}/api/empresas`)
                        .then(r => r.json())
                        .then(data => setEmpresas(data));
                    } else {
                      alert('Error al crear empresa');
                    }
                  } catch (err) {
                    console.error(err);
                    alert('Error de red');
                  }
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-xs active:scale-95 border border-slate-800 cursor-pointer"
              >
                Crear Empresa
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Facturas;
