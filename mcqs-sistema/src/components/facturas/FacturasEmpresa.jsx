import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import NuevaFacturaModal from './NuevaFacturaModal';
import toast from 'react-hot-toast';
import DocumentViewerModal from '../DocumentViewerModal';

const FacturasEmpresa = ({ empresa, onBack }) => {
  const [activeTab, setActiveTab] = useState(() => {
    if (empresa?.tipo) {
      if (empresa.tipo === 'fiel_cumplimiento') return 'cumplimiento';
      if (empresa.tipo === 'adelanto_materiales') return 'materiales';
      if (empresa.tipo === 'adelanto_directo') return 'directo';
    }
    return 'cumplimiento';
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facturaToEdit, setFacturaToEdit] = useState(null);
  const [documentViewerData, setDocumentViewerData] = useState({ isOpen: false, url: '', title: '' });

  // Datos de facturas
  const [facturasData, setFacturasData] = useState({
    cumplimiento: [],
    materiales: [],
    directo: [],
    credito: [] // Notas de crédito (Facturas observadas)
  });

  const cargarFacturas = async () => {
    try {
      if (!empresa?.id) return;
      const response = await fetch(`${API_BASE_URL}/api/facturas?empresa_id=${empresa.id}`);
      const data = await response.json();
      if (!Array.isArray(data)) return;
      
      data.sort((a, b) => {
        const dateA = a.fecha_salida ? new Date(a.fecha_salida) : new Date(0);
        const dateB = b.fecha_salida ? new Date(b.fecha_salida) : new Date(0);
        return dateB - dateA;
      });

      const agrupado = { cumplimiento: [], materiales: [], directo: [], credito: [] };
      data.forEach(factura => {
        if (factura.observada === 1) {
          agrupado.credito.push(factura);
        } else {
          if (factura.tipo_fianza === 'fiel_cumplimiento') agrupado.cumplimiento.push(factura);
          else if (factura.tipo_fianza === 'adelanto_materiales') agrupado.materiales.push(factura);
          else if (factura.tipo_fianza === 'adelanto_directo') agrupado.directo.push(factura);
          else agrupado.cumplimiento.push(factura);
        }
      });
      setFacturasData(agrupado);
    } catch (error) {
      console.error('Error cargando facturas:', error);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer.')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/facturas/${id}`, { method: 'DELETE' });
      if (res.ok) {
        cargarFacturas();
        toast.success('Factura eliminada correctamente');
      } else {
        alert('Error al eliminar la factura.');
      }
    } catch (error) {
      console.error(error);
      alert('Error de red al eliminar.');
    }
  };

  useEffect(() => {
    cargarFacturas();
  }, []);

  // Efecto para hacer scroll hacia la factura seleccionada desde el buscador global
  useEffect(() => {
    if (empresa?.facturaId && facturasData[activeTab]?.length > 0) {
      setTimeout(() => {
        const row = document.getElementById(`factura-row-${empresa.facturaId}`);
        if (row) {
          row.scrollIntoView({ behavior: 'smooth', block: 'center' });
          row.classList.add('bg-blue-50', 'ring-2', 'ring-blue-400');
          setTimeout(() => {
            row.classList.remove('bg-blue-50', 'ring-2', 'ring-blue-400');
          }, 3000);
        }
      }, 300);
    }
  }, [facturasData, activeTab, empresa?.facturaId]);

  const tabs = [
    { id: 'cumplimiento', label: 'Fiel Cumplimiento', icon: '🛡️' },
    { id: 'materiales', label: 'Adelanto Materiales', icon: '📦' },
    { id: 'directo', label: 'Adelanto Directo', icon: '⚡' },
    { id: 'credito', label: 'Notas de Crédito (Obs.)', icon: '⚠️' },
  ];

  const currentData = facturasData[activeTab] || [];
  const totalMontoTab = currentData.reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);

  return (
    <div className="w-full space-y-4 pb-8 font-sans select-none text-slate-900">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
        <div>
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 hover:text-slate-950 font-bold uppercase tracking-wider transition-all mb-2.5 border border-slate-200"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver a Empresas</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight uppercase">
                {empresa?.nombre || 'Empresa'}
              </h1>
              <p className="text-xs font-semibold text-blue-600 tracking-wider">
                Módulo de Facturación y Notas de Crédito
              </p>
            </div>
          </div>
        </div>

        {/* Botón Nueva Factura */}
        <button 
          onClick={() => { setFacturaToEdit(null); setIsModalOpen(true); }}
          className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-95"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Factura</span>
        </button>
      </div>

      <NuevaFacturaModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setFacturaToEdit(null); }} 
        onSuccess={() => { setIsModalOpen(false); setFacturaToEdit(null); cargarFacturas(); }}
        consorcioPreseleccionado={empresa?.nombre} 
        empresaId={empresa?.id}
        editData={facturaToEdit}
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          const count = (facturasData[tab.id] || []).length;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold tracking-wider transition-all flex items-center gap-1.5 whitespace-nowrap border ${
                isActive 
                  ? tab.id === 'credito'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs font-black'
                    : 'bg-slate-950 text-white border-slate-950 shadow-xs font-black'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-950'
              }`}
            >
              <span className="text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[11px] font-mono font-bold ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5 text-slate-900">
        <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider">
            {activeTab === 'credito' 
              ? 'Facturas Observadas (Notas de Crédito)' 
              : `Registros: ${tabs.find(t => t.id === activeTab)?.label}`}
          </h3>
          
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Categoría:</span>
            <span className="text-xs font-black font-mono text-blue-600 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-xl shadow-xs">
              S/ {totalMontoTab.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                <th className="pb-2 px-2.5 w-10 text-center">N°</th>
                <th className="pb-2 px-3">N° FACTURA</th>
                <th className="pb-2 px-3">MONTO</th>
                <th className="pb-2 px-3">EMISIÓN / SALIDA</th>
                <th className="pb-2 px-3">TIPO FIANZA</th>
                <th className="pb-2 px-3">FIANZA ASOCIADA</th>
                <th className="pb-2 px-3 text-right">ACCIÓN</th>
              </tr>
            </thead>
            <tbody className="text-slate-900 divide-y divide-slate-100">
              {currentData.map((item, index) => {
                const formatFecha = (d) => {
                  if (!d) return 'N/A';
                  return new Date(d).toLocaleDateString('es-PE');
                };

                return (
                  <tr key={item.id || index} id={`factura-row-${item.id}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-2.5 font-mono text-center text-slate-400 font-bold text-xs">{index + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-950">
                      <div className="flex items-center space-x-1.5">
                        <span>{item.numero || item.id}</span>
                        {item.observada === 1 && (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                            OBSERVADA
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-black text-slate-950 text-xs">
                      S/ {parseFloat(item.monto || 0).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-600">{formatFecha(item.fecha_salida)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-[10px] uppercase font-bold border border-slate-200/80">
                        {(item.tipo_fianza || 'fiel_cumplimiento').replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono text-slate-600">{item.numero_fianza || '---'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button 
                          onClick={() => { setFacturaToEdit(item); setIsModalOpen(true); }}
                          title="Editar Factura"
                          className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-blue-600 transition-all border border-slate-200 text-xs"
                        >
                          ✏️
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          title="Eliminar Factura"
                          className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 hover:text-rose-600 transition-all border border-slate-200 text-xs"
                        >
                          🗑️
                        </button>
                        <button 
                          onClick={() => {
                            if (item.archivo_ruta) {
                              const urlPath = item.archivo_ruta.replace(/\\/g, '/');
                              const finalUrl = `${API_BASE_URL}/${urlPath.startsWith('/') ? urlPath.substring(1) : urlPath}`;
                              setDocumentViewerData({
                                isOpen: true,
                                url: finalUrl,
                                title: `Factura: ${item.numero || item.id}`
                              });
                            } else {
                              toast('No hay archivo adjunto para esta factura');
                            }
                          }}
                          className={`p-1.5 rounded-lg text-xs transition-all ${
                            item.archivo_ruta ? 'text-blue-600 bg-blue-50 border border-blue-200 hover:bg-blue-100' : 'text-slate-300 bg-slate-50 border border-slate-200'
                          }`}
                          title={item.archivo_ruta ? "Ver Documento PDF" : "Sin documento"}
                        >
                          📄
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {currentData.length === 0 && (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-xs text-slate-400 font-bold uppercase">
                    No hay facturas registradas en esta categoría
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      <DocumentViewerModal 
        isOpen={documentViewerData.isOpen}
        onClose={() => setDocumentViewerData({ ...documentViewerData, isOpen: false })}
        fileUrl={documentViewerData.url}
        title={documentViewerData.title}
      />
    </div>
  );
};

export default FacturasEmpresa;
