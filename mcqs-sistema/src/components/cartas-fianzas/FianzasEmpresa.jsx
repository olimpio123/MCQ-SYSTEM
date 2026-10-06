import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import NuevaFianzaModal from './NuevaFianzaModal';
import toast from 'react-hot-toast';
import DocumentViewerModal from '../DocumentViewerModal';
import NuevaFacturaModal from '../facturas/NuevaFacturaModal';
import { Trash2 } from "lucide-react";

const FianzasEmpresa = ({ empresa, onBack }) => {
  const [activeTab, setActiveTab] = useState(() => {
    if (empresa?.tipo) {
      if (empresa.tipo === 'fiel_cumplimiento') return 'cumplimiento';
      if (empresa.tipo === 'adelanto_materiales') return 'materiales';
      if (empresa.tipo === 'adelanto_directo') return 'directo';
    }
    return 'cumplimiento';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fianzaToEdit, setFianzaToEdit] = useState(null);
  const [documentViewerData, setDocumentViewerData] = useState({ isOpen: false, url: '', title: '' });
  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false);
  const [fianzaForFactura, setFianzaForFactura] = useState(null);

  // Estados para Observación
  const [selectedFianzaForObs, setSelectedFianzaForObs] = useState(null);
  const [isObsModalOpen, setIsObsModalOpen] = useState(false);
  const [newObsText, setNewObsText] = useState('');
  const [isSavingObs, setIsSavingObs] = useState(false);

  const handleSaveObservation = async () => {
    if (!selectedFianzaForObs) return;
    setIsSavingObs(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/fianzas/${selectedFianzaForObs.id}/observacion`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ observacion: newObsText })
      });
      if (res.ok) {
        toast.success('Observación guardada exitosamente.');
        setIsObsModalOpen(false);
        cargarFianzas();
      } else {
        toast.error('Error al guardar la observación.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de red al guardar la observación.');
    } finally {
      setIsSavingObs(false);
    }
  };

  // Datos de cartas fianza
  const [fianzasData, setFianzasData] = useState({
    cumplimiento: [],
    materiales: [],
    directo: []
  });

  const cargarFianzas = async () => {
    try {
      if (!empresa?.id) return;
      const response = await fetch(`${API_BASE_URL}/api/fianzas?empresa_id=${empresa.id}`);
      const data = await response.json();
      if (!Array.isArray(data)) return;
      
      data.sort((a, b) => {
        const dateA = a.fecha_inicio ? new Date(a.fecha_inicio) : new Date(0);
        const dateB = b.fecha_inicio ? new Date(b.fecha_inicio) : new Date(0);
        return dateB - dateA;
      });

      const agrupado = { cumplimiento: [], materiales: [], directo: [] };
      data.forEach(fianza => {
        if (fianza.tipo === 'fiel_cumplimiento') agrupado.cumplimiento.push(fianza);
        else if (fianza.tipo === 'adelanto_materiales') agrupado.materiales.push(fianza);
        else if (fianza.tipo === 'adelanto_directo') agrupado.directo.push(fianza);
      });
      setFianzasData(agrupado);
    } catch (error) {
      console.error('Error cargando cartas fianza:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta fianza? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/fianzas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarFianzas();
        toast.success('Carta Fianza eliminada correctamente');
      } else {
        alert('Error al eliminar la fianza.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red al eliminar.');
    }
  };

  useEffect(() => {
    cargarFianzas();
  }, []);

  // Efecto para hacer scroll hacia la fianza seleccionada desde el buscador global
  useEffect(() => {
    if (empresa?.fianzaId && fianzasData[activeTab]?.length > 0) {
      setTimeout(() => {
        const row = document.getElementById(`fianza-row-${empresa.fianzaId}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.classList.add('bg-blue-50', 'ring-2', 'ring-blue-400');
          setTimeout(() => {
            row.classList.remove('bg-blue-50', 'ring-2', 'ring-blue-400');
          }, 3000);
        }
      }, 300);
    }
  }, [fianzasData, activeTab, empresa?.fianzaId]);

  const tabs = [
    { 
      id: 'cumplimiento', 
      label: 'Fiel Cumplimiento',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      )
    },
    { 
      id: 'materiales', 
      label: 'Adelanto Materiales',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      )
    },
    { 
      id: 'directo', 
      label: 'Adelanto Directo',
      icon: (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
  ];

  const currentData = fianzasData[activeTab] || [];

  const todasLasFianzas = [
    ...(fianzasData.cumplimiento || []),
    ...(fianzasData.materiales || []),
    ...(fianzasData.directo || [])
  ];

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const vencidasList = [];
  const porVencerList = [];
  const vigentesList = [];

  todasLasFianzas.forEach(f => {
    const v = new Date(f.fecha_vencimiento);
    v.setHours(0, 0, 0, 0);
    const diffDays = Math.round((v - hoy) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      vencidasList.push(f);
    } else if (diffDays <= 30) {
      porVencerList.push(f);
    } else {
      vigentesList.push(f);
    }
  });

  const totalMontoTab = currentData.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);

  return (
    <div className="w-full space-y-4 pb-10 font-sans select-none text-slate-900">
      
      {/* ========================================================================= */}
      {/* 1. TOP HEADER & BACK BUTTON                                               */}
      {/* ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5">
        <div className="space-y-2">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-slate-950 uppercase tracking-wider transition-colors px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 shadow-xs cursor-pointer"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver a Empresas</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight uppercase">
                {empresa?.nombre || 'Empresa'}
              </h1>
              <p className="text-[11px] font-bold text-blue-600 uppercase tracking-wider">
                Expediente de Garantías, Vencimientos y Facturación
              </p>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button 
          onClick={() => { setFianzaToEdit(null); setIsModalOpen(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 border border-slate-800 cursor-pointer active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Fianza</span>
        </button>
      </div>

      <NuevaFianzaModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setFianzaToEdit(null); }}
        onSuccess={() => { setIsModalOpen(false); setFianzaToEdit(null); cargarFianzas(); }}
        consorcioPreseleccionado={empresa?.nombre} 
        empresaId={empresa?.id}
        editData={fianzaToEdit}
      />

      <NuevaFacturaModal 
        isOpen={isFacturaModalOpen} 
        onClose={() => { setIsFacturaModalOpen(false); setFianzaForFactura(null); }}
        onSuccess={() => { setIsFacturaModalOpen(false); setFianzaForFactura(null); cargarFianzas(); }}
        consorcioPreseleccionado={empresa?.nombre} 
        empresaId={empresa?.id}
        prefilledData={fianzaForFactura ? { numero_fianza: fianzaForFactura.numero, tipo_fianza: fianzaForFactura.tipo } : null}
      />

      {/* ========================================================================= */}
      {/* 2. TOP KPI CARDS (3 Columns)                                              */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        
        {/* KPI 1 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-2xl font-black text-slate-950 font-mono leading-none">{todasLasFianzas.length}</h4>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Total en Cartera</p>
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black text-slate-950 leading-none">{vigentesList.length} Vigentes</span>
                {vencidasList.length > 0 && (
                  <span className="text-[10px] font-bold bg-rose-600 text-white px-2 py-0.5 rounded-lg shadow-xs">
                    {vencidasList.length} Vencidas
                  </span>
                )}
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Monitoreo de Plazos</p>
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="bg-white rounded-2xl p-4 shadow-xs border border-slate-200/80 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shadow-xs flex-shrink-0">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-950">
                <span>FC: {fianzasData.cumplimiento?.length || 0}</span>
                <span>•</span>
                <span>AD: {fianzasData.directo?.length || 0}</span>
                <span>•</span>
                <span>AM: {fianzasData.materiales?.length || 0}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">Por Modalidad</p>
            </div>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. SEGMENTED TABS                                                         */}
      {/* ========================================================================= */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const count = (fianzasData[tab.id] || []).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-2 whitespace-nowrap border cursor-pointer ${
                isActive 
                  ? 'bg-slate-950 text-white border-slate-950 shadow-xs' 
                  : 'bg-white text-slate-800 border-slate-200 hover:bg-slate-50 shadow-xs'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-2 py-0.2 rounded-md text-[11px] font-mono font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 4. DATA TABLE CONTAINER                                                   */}
      {/* ========================================================================= */}
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 text-slate-900">
        
        <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">
            Garantías: {tabs.find(t => t.id === activeTab)?.label}
          </h3>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 uppercase font-bold">Total Monto:</span>
            <span className="text-xs sm:text-sm font-black font-mono text-blue-700 bg-blue-50 px-3 py-1 rounded-xl border border-blue-200 shadow-xs">
              S/ {totalMontoTab.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        {/* Table */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                <th className="pb-2 px-2.5 w-10 text-center">N°</th>
                <th className="pb-2 px-3">N° DE FIANZA</th>
                <th className="pb-2 px-3">MONTO</th>
                <th className="pb-2 px-3">TIPO</th>
                <th className="pb-2 px-3">EMISIÓN</th>
                <th className="pb-2 px-3">VENCIMIENTO</th>
                <th className="pb-2 px-3 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="text-xs text-slate-800 font-semibold">
              {currentData.map((item, index) => {
                const formatFecha = (d) => {
                  if (!d) return 'N/A';
                  return new Date(d).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' });
                };

                const vencimiento = new Date(item.fecha_vencimiento);
                const diasFaltantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
                
                let badgeEstado = null;
                if (diasFaltantes < 0) {
                  badgeEstado = (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-rose-50 text-rose-700 border border-rose-200">
                      Vencida
                    </span>
                  );
                } else if (diasFaltantes <= 30) {
                  badgeEstado = (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-amber-50 text-amber-800 border border-amber-200">
                      Faltan {diasFaltantes}d
                    </span>
                  );
                } else {
                  badgeEstado = (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Vigente
                    </span>
                  );
                }

                return (
                  <tr key={item.id || index} id={`fianza-row-${item.id}`} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2.5 font-mono text-center text-slate-400">{index + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-600">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs">{item.numero}</span>
                        {item.tiene_factura > 0 ? (
                          <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Facturada</span>
                        ) : (
                          <span className="px-1.5 py-0.2 rounded-md text-[9px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">Sin Factura</span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-950 text-xs">
                      <span className="text-slate-400 mr-0.5">{item.moneda === 'USD' ? '$' : 'S/'}</span>
                      {parseFloat(item.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[10px] font-bold uppercase text-slate-700">
                        {item.tipo.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-700">{formatFecha(item.fecha_inicio)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-800 font-bold">{formatFecha(item.fecha_vencimiento)}</span>
                        {badgeEstado}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {(!item.tiene_factura || item.tiene_factura === 0) && (
                          <button 
                            onClick={() => {
                              setFianzaForFactura(item);
                              setIsFacturaModalOpen(true);
                            }}
                            title="Facturar"
                            className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-all uppercase cursor-pointer"
                          >
                            Facturar
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setSelectedFianzaForObs(item);
                            setNewObsText(item.observacion || '');
                            setIsObsModalOpen(true);
                          }}
                          className={`p-1.5 rounded-lg border transition-all text-xs cursor-pointer ${
                            item.observacion 
                              ? 'text-amber-700 bg-amber-50 border-amber-300 shadow-xs' 
                              : 'text-slate-500 hover:text-slate-950 border-slate-200 hover:bg-slate-100'
                          }`}
                          title="Observación"
                        >
                          💬
                        </button>

                        <button 
                          onClick={() => { setFianzaToEdit(item); setIsModalOpen(true); }}
                          title="Editar Fianza"
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-all text-xs cursor-pointer"
                        >
                          ✏️
                        </button>

                        <button 
                          onClick={() => handleDelete(item.id)}
                          title="Eliminar Fianza"
                          className="p-1.5 flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                        >
                          <Trash2 size={15} strokeWidth={2} />
                        </button>

                        <button 
                          onClick={() => {
                            if (item.archivo_ruta) {
                              const urlPath = item.archivo_ruta.replace(/\\/g, '/');
                              const finalUrl = `${API_BASE_URL}/${urlPath.startsWith('/') ? urlPath.substring(1) : urlPath}`;
                              setDocumentViewerData({
                                isOpen: true,
                                url: finalUrl,
                                title: `Fianza: ${item.numero || item.id}`
                              });
                            } else {
                              toast('No hay archivo adjunto para esta fianza');
                            }
                          }}
                          className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                            item.archivo_ruta 
                              ? 'text-blue-700 bg-blue-50 border border-blue-200 shadow-xs' 
                              : 'text-slate-300'
                          }`}
                          title={item.archivo_ruta ? "Ver Documento PDF" : "Sin documento"}
                        >
                          <svg width={18} height={18} fill="none" viewBox="0 0 40 40">
                              <path stroke="#D5D7DA" strokeWidth={1.5} d="M7.75 4A3.25 3.25 0 0 1 11 .75h16c.121 0 .238.048.323.134l10.793 10.793a.46.46 0 0 1 .134.323v24A3.25 3.25 0 0 1 35 39.25H11A3.25 3.25 0 0 1 7.75 36z" />
                              <path stroke="#D5D7DA" strokeWidth={1.5} d="M27 .5V8a4 4 0 0 0 4 4h7.5" />
                              <rect width={26} height={16} x={1} y={18} fill="#D92D20" rx={2} />
                              <path fill="#fff" d="M4.832 30v-7.273h2.87q.826 0 1.41.316.582.314.887.87.31.555.31 1.279t-.313 1.278q-.313.555-.906.863-.59.309-1.427.309h-1.83V26.41h1.581q.444 0 .732-.153.29-.156.433-.43.145-.276.145-.635 0-.363-.145-.632a.97.97 0 0 0-.433-.423q-.291-.153-.74-.153H6.37V30zm9.053 0h-2.578v-7.273h2.6q1.095 0 1.889.437.791.433 1.218 1.246.43.814.43 1.947 0 1.136-.43 1.953a2.95 2.95 0 0 1-1.226 1.253q-.795.437-1.903.437m-1.04-1.317h.976q.682 0 1.147-.242.47-.244.703-.756.238-.516.238-1.328 0-.807-.238-1.318a1.54 1.54 0 0 0-.7-.753q-.465-.24-1.146-.241h-.98zM18.582 30v-7.273h4.816v1.268H20.12v1.733h2.958v1.268H20.12V30z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {currentData.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-xs text-slate-400 font-bold uppercase">
                    No hay cartas fianza registradas en esta modalidad
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. MODAL OBSERVACIÓN                                                      */}
      {/* ========================================================================= */}
      {isObsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity" 
            onClick={() => setIsObsModalOpen(false)}
          ></div>
          <div className="relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col text-slate-900 animate-fadeIn">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-950">Observación de Fianza</h3>
                <p className="text-[11px] text-blue-600 font-mono font-bold">N° {selectedFianzaForObs?.numero}</p>
              </div>
              <button 
                onClick={() => setIsObsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 hover:text-slate-950 flex items-center justify-center font-bold text-xs border border-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Detalle / Comentario
              </label>
              <textarea 
                rows={3}
                value={newObsText}
                onChange={(e) => setNewObsText(e.target.value)}
                placeholder="Escribe aquí las observaciones relevantes..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white resize-none shadow-xs"
              />
            </div>

            <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center space-x-2">
              <button 
                onClick={() => setIsObsModalOpen(false)} 
                className="px-3.5 py-2 text-xs font-bold text-slate-600 hover:text-slate-950 uppercase tracking-wider cursor-pointer"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveObservation}
                disabled={isSavingObs}
                className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-xs border border-slate-800 cursor-pointer disabled:opacity-50"
              >
                {isSavingObs ? 'Guardando...' : 'Guardar Observación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      <DocumentViewerModal 
        isOpen={documentViewerData.isOpen}
        onClose={() => setDocumentViewerData({ ...documentViewerData, isOpen: false })}
        fileUrl={documentViewerData.url}
        title={documentViewerData.title}
      />

    </div>
  );
};

export default FianzasEmpresa;
