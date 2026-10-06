import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';

const CartaFianzas = ({ onOpenEmpresa }) => {
  const [empresas, setEmpresas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [nombreNuevaEmpresa, setNombreNuevaEmpresa] = useState('');
  const [creando, setCreando] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [activeAlertTab, setActiveAlertTab] = useState('vencidas');
  const [dashboardData, setDashboardData] = useState({
    emitidas: { total: 0, cumplimiento: 0, directo: 0, materiales: 0 },
    porVencerCount: 0,
    proximasVencer: [],
    recientes: []
  });

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/empresas`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setEmpresas(data);
        } else {
          console.error('Respuesta no válida para empresas:', data);
          setEmpresas([]);
        }
      })
      .catch(err => {
        console.error(err);
        setEmpresas([]);
      });
      
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (searchTerm.trim().length > 0) {
      setIsSearching(true);
      const delayDebounceFn = setTimeout(() => {
        fetch(`${API_BASE_URL}/api/fianzas?search=${encodeURIComponent(searchTerm)}`)
          .then(res => res.json())
          .then(data => {
            setSearchResults(Array.isArray(data) ? data : []);
            setIsSearching(false);
          })
          .catch(err => {
            console.error(err);
            setSearchResults([]);
            setIsSearching(false);
          });
      }, 300);
      return () => clearTimeout(delayDebounceFn);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm]);

  const fetchDashboardData = async () => {
    fetch(`${API_BASE_URL}/api/fianzas/dashboard`)
      .then(res => res.json())
      .then(data => {
        if (data && typeof data === 'object' && !data.error) {
          setDashboardData({
            emitidas: data.emitidas || { total: 0, cumplimiento: 0, directo: 0, materiales: 0 },
            porVencerCount: data.porVencerCount || 0,
            proximasVencer: Array.isArray(data.proximasVencer) ? data.proximasVencer : [],
            recientes: Array.isArray(data.recientes) ? data.recientes : []
          });
        }
      })
      .catch(err => console.error('Error fetching dashboard:', err));
  };

  const proximasVencerSafe = Array.isArray(dashboardData?.proximasVencer) ? dashboardData.proximasVencer : [];
  const vencidas = proximasVencerSafe.filter(a => a && a.dias_faltantes < 0);
  const porVencer = proximasVencerSafe.filter(a => a && a.dias_faltantes >= 0);
  const recientes = Array.isArray(dashboardData?.recientes) ? dashboardData.recientes : [];

  const handleCrearEmpresa = async () => {
    if (!nombreNuevaEmpresa.trim()) {
      toast.error('Por favor ingresa el nombre de la empresa o consorcio');
      return;
    }
    setCreando(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/empresas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nombreNuevaEmpresa.trim() })
      });
      if (res.ok) {
        toast.success('Empresa registrada exitosamente');
        setShowModal(false);
        setNombreNuevaEmpresa('');
        fetch(`${API_BASE_URL}/api/empresas`)
          .then(r => r.json())
          .then(data => setEmpresas(data));
      } else {
        toast.error('Error al registrar la empresa');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de conexión al registrar empresa');
    } finally {
      setCreando(false);
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.setTextColor(30, 41, 59);
    doc.text('Reporte Ejecutivo de Cartas Fianza (± 30 días)', 14, 22);
    
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generado el: ${new Date().toLocaleString()}`, 14, 29);
    
    const tableColumn = ["N° DE FIANZA", "EMPRESA / CONSORCIO", "TIPO", "VENCIMIENTO", "ESTADO"];
    
    const mapRows = (arr) => arr.map(alerta => {
      let tipoFormat = alerta.tipo;
      if (tipoFormat === 'fiel_cumplimiento') tipoFormat = 'Fiel Cumplimiento';
      if (tipoFormat === 'adelanto_directo') tipoFormat = 'Adelanto Directo';
      if (tipoFormat === 'adelanto_materiales') tipoFormat = 'Adelanto Materiales';
      
      const vencimiento = new Date(alerta.fecha_vencimiento).toLocaleDateString('es-PE');
      const diasEstado = alerta.dias_faltantes < 0 
        ? `VENCIDA (HACE ${Math.abs(alerta.dias_faltantes)} DÍAS)` 
        : `FALTAN ${alerta.dias_faltantes} DÍAS`;
        
      return [alerta.numero, alerta.consorcio || alerta.empresa || 'N/A', tipoFormat, vencimiento, diasEstado];
    });
    
    const vencidasRows = mapRows(vencidas);
    const porVencerRows = mapRows(porVencer);
    
    let finalY = 36;
    
    if (vencidasRows.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(225, 29, 72);
      doc.text('FIANZAS VENCIDAS (ÚLTIMOS 30 DÍAS)', 14, finalY);
      
      autoTable(doc, {
        head: [tableColumn],
        body: vencidasRows,
        startY: finalY + 4,
        theme: 'grid',
        headStyles: { fillColor: [225, 29, 72], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [255, 241, 242] },
        margin: { top: 10 }
      });
      
      finalY = doc.lastAutoTable.finalY + 12;
    }
    
    if (porVencerRows.length > 0) {
      doc.setFontSize(11);
      doc.setTextColor(217, 119, 6);
      doc.text('FIANZAS POR VENCER (PRÓXIMOS 30 DÍAS)', 14, finalY);
      
      autoTable(doc, {
        head: [tableColumn],
        body: porVencerRows,
        startY: finalY + 4,
        theme: 'grid',
        headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: 'bold', fontSize: 8 },
        bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
        alternateRowStyles: { fillColor: [254, 243, 199] },
        margin: { top: 10 }
      });
    }
    
    doc.save(`reporte-vencimientos-fianzas-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  return (
    <div className="w-full space-y-4 pb-8 font-sans select-none text-slate-900">
      
      {/* ========================================================================= */}
      {/* 1. TOP 4 CRISP WHITE KPI CARDS                                            */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Total */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-950 leading-none">{dashboardData?.emitidas?.total || 0}</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total en Cartera</p>
            </div>
          </div>
        </div>

        {/* KPI 2: Nuevas Mes */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-950 leading-none">{(dashboardData?.recientes || []).length}</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Nuevas Este Mes</p>
            </div>
          </div>
        </div>

        {/* KPI 3: Por Vencer */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-950 leading-none">{porVencer.length}</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Por Vencer (30d)</p>
            </div>
          </div>
        </div>

        {/* KPI 4: Vencidas */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-950 leading-none">{vencidas.length}</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Fianzas Vencidas</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. TOOLBAR & ACTION DOCK                                                  */}
      {/* ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xs rounded-2xl p-3.5 sm:p-4 flex flex-col md:flex-row items-center justify-between gap-3">
        
        {/* Title */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-base font-black text-slate-950 tracking-wide uppercase">Cartas Fianza</h2>
            <p className="text-xs text-slate-500 font-semibold">Garantías y control preventivo</p>
          </div>
        </div>

        {/* Search & Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 w-full md:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              placeholder="Buscar empresa o fianza..." 
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

          {/* Toggle Alerts Panel Button */}
          <button 
            onClick={() => setShowDashboard(!showDashboard)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 border cursor-pointer ${
              showDashboard
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-xs'
            }`}
          >
            <span>{showDashboard ? 'Ocultar Alertas' : 'Panel Alertas'}</span>
            {(porVencer.length > 0 || vencidas.length > 0) && (
              <span className="bg-rose-500 text-white px-1.5 py-0.2 rounded-full text-[10px] font-black animate-pulse shadow-xs">
                {vencidas.length + porVencer.length}
              </span>
            )}
          </button>

          {/* New Company Button */}
          <button 
            onClick={() => {
              setNombreNuevaEmpresa('');
              setShowModal(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 border border-slate-800 cursor-pointer active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nueva Empresa</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ALERTS & MONITORING DOCK                                               */}
      {/* ========================================================================= */}
      {showDashboard && (
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xs rounded-2xl p-4 sm:p-5 space-y-4 text-slate-900">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Auditoría de Vencimientos</h3>
              <p className="text-xs text-slate-500 font-semibold">Control de garantías en plazo crítico</p>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200">
                <button
                  onClick={() => setActiveAlertTab('vencidas')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeAlertTab === 'vencidas' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Vencidas ({vencidas.length})
                </button>
                <button
                  onClick={() => setActiveAlertTab('porVencer')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeAlertTab === 'porVencer' ? 'bg-amber-400 text-slate-950 shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Por Vencer ({porVencer.length})
                </button>
                <button
                  onClick={() => setActiveAlertTab('recientes')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeAlertTab === 'recientes' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:text-slate-950'
                  }`}
                >
                  Recientes ({recientes.length})
                </button>
              </div>

              <button 
                onClick={exportToPDF}
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <span>Descargar PDF</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  <th className="pb-2 px-3">N° FIANZA</th>
                  <th className="pb-2 px-3">EMPRESA / CONSORCIO</th>
                  <th className="pb-2 px-3">TIPO</th>
                  <th className="pb-2 px-3">VENCIMIENTO</th>
                  <th className="pb-2 px-3 text-right">ESTADO</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  let currentList = [];
                  if (activeAlertTab === 'vencidas') currentList = vencidas;
                  else if (activeAlertTab === 'porVencer') currentList = porVencer;
                  else if (activeAlertTab === 'recientes') currentList = recientes;

                  if (currentList.length === 0) {
                    return (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-400 font-bold uppercase text-xs">
                          No se encontraron registros en esta categoría
                        </td>
                      </tr>
                    );
                  }

                  return currentList.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{item?.numero || '-'}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900">{item?.consorcio || item?.empresa || 'N/A'}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] uppercase font-bold text-slate-700">
                          {item?.tipo ? String(item.tipo).replace('_', ' ') : 'N/A'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-xs text-slate-800">
                        {item?.fecha_vencimiento ? new Date(item.fecha_vencimiento).toLocaleDateString('es-PE') : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                          item?.dias_faltantes < 0 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          {item?.dias_faltantes < 0 ? `Vencida (${Math.abs(item.dias_faltantes)}d)` : `Faltan ${item.dias_faltantes || 0}d`}
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. COMPANY CARDS GRID                                                     */}
      {/* ========================================================================= */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Empresas y Consorcios ({Array.isArray(empresas) ? empresas.length : 0})
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3.5 sm:gap-4">
          {Array.isArray(empresas) && empresas.map((empresa) => {
            const totalFianzas = empresa.fianzasActivas || 0;
            const fc = empresa.totalFielCumplimiento || 0;
            const ad = empresa.totalAdelantoDirecto || 0;
            const am = empresa.totalAdelantoMateriales || 0;

            return (
              <div 
                key={empresa.id}
                onClick={() => onOpenEmpresa(empresa)}
                className="group relative bg-white rounded-2xl p-4 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md border border-slate-200/80 hover:border-blue-400 flex flex-col justify-between overflow-hidden shadow-xs min-h-[160px]"
              >
                {/* Top Subtle Indigo-Blue Accent Bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 opacity-80 group-hover:opacity-100 transition-opacity" />

                <div>
                  {/* Top Header Row */}
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold border shadow-xs flex items-center gap-1.5 ${
                      totalFianzas > 0 
                        ? 'bg-blue-50 text-blue-700 border-blue-200' 
                        : 'bg-slate-100 text-slate-500 border-slate-200'
                    }`}>
                      {totalFianzas > 0 && <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>}
                      {totalFianzas} {totalFianzas === 1 ? 'Fianza' : 'Fianzas'}
                    </span>
                  </div>

                  {/* Company Name */}
                  <h4 className="text-xs sm:text-sm font-bold text-slate-950 uppercase tracking-tight line-clamp-2 mb-2 group-hover:text-blue-600 transition-colors">
                    {empresa.nombre}
                  </h4>
                </div>

                {/* Structured Metrics Info Pod */}
                <div>
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5 mb-2.5 text-[11px]">
                    {/* Fiel Cumplimiento */}
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        <span>Fiel Cumplimiento</span>
                      </span>
                      <span className={`font-mono font-bold ${fc > 0 ? 'text-blue-700' : 'text-slate-400'}`}>
                        {fc}
                      </span>
                    </div>

                    {/* Adelanto Directo */}
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                        <span>Adelanto Directo</span>
                      </span>
                      <span className={`font-mono font-bold ${ad > 0 ? 'text-indigo-700' : 'text-slate-400'}`}>
                        {ad}
                      </span>
                    </div>

                    {/* Adelanto Materiales */}
                    <div className="flex justify-between items-center text-slate-700">
                      <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        <span>Adelanto Materiales</span>
                      </span>
                      <span className={`font-mono font-bold ${am > 0 ? 'text-purple-700' : 'text-slate-400'}`}>
                        {am}
                      </span>
                    </div>
                  </div>

                  {/* Action Link with Animated Arrow */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] uppercase font-bold text-slate-500 group-hover:text-blue-600 transition-colors">
                    <span className="tracking-wider">Gestionar Fianzas</span>
                    <div className="w-5 h-5 rounded-full bg-slate-50 group-hover:bg-blue-600 group-hover:text-white text-slate-600 flex items-center justify-center border border-slate-200 group-hover:border-blue-600 shadow-xs transition-all">
                      <span className="text-[10px] font-bold">→</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. NEW COMPANY MODAL WINDOW                                               */}
      {/* ========================================================================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity" 
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-md overflow-hidden text-slate-900 flex flex-col animate-fadeIn">
            
            <div className="px-5 py-3.5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">Nueva Empresa</h3>
                <p className="text-[11px] font-semibold text-slate-500">Crear consorcio o contratista</p>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-950 flex items-center justify-center text-xs font-bold border border-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nombre de la Empresa o Consorcio
                </label>
                <input 
                  type="text" 
                  value={nombreNuevaEmpresa}
                  onChange={(e) => setNombreNuevaEmpresa(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white shadow-xs uppercase" 
                  placeholder="Ej. CONSORCIO VIAL..." 
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCrearEmpresa();
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center space-x-2">
              <button 
                onClick={() => setShowModal(false)} 
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-950 uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleCrearEmpresa}
                disabled={creando}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow-xs disabled:opacity-50 transition-all border border-slate-800 cursor-pointer active:scale-95 flex items-center gap-1.5"
              >
                {creando && <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>}
                <span>{creando ? 'Creando...' : 'Crear Empresa'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CartaFianzas;
