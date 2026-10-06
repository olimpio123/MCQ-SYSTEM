import React, { useState, useEffect, useMemo } from 'react';
import NuevoCargoModal from './NuevoCargoModal';
import VerCargoModal from './VerCargoModal';
import { API_BASE_URL } from '../../config/api';

const CargosDetalle = ({ categoria, onBack }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewCargo, setViewCargo] = useState(null);
  const [editCargo, setEditCargo] = useState(null);
  const [cargos, setCargos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');

  const themeConfig = useMemo(() => {
    const id = categoria?.id;
    switch (id) {
      case 'pagare':
        return {
          gradient: 'from-sky-500 to-indigo-500',
          accentText: 'text-sky-700',
          borderHover: 'hover:border-sky-400',
          activeLeft: 'border-l-sky-500',
          iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
          btnGradient: 'bg-slate-900 hover:bg-slate-800 text-white font-black',
          badgeText: 'text-sky-700 bg-sky-50 border-sky-200',
        };
      case 'cheques':
        return {
          gradient: 'from-emerald-500 to-teal-500',
          accentText: 'text-emerald-700',
          borderHover: 'hover:border-emerald-400',
          activeLeft: 'border-l-emerald-500',
          iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
          btnGradient: 'bg-slate-900 hover:bg-slate-800 text-white font-black',
          badgeText: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        };
      case 'liberacion':
        return {
          gradient: 'from-purple-500 to-fuchsia-500',
          accentText: 'text-purple-700',
          borderHover: 'hover:border-purple-400',
          activeLeft: 'border-l-purple-500',
          iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
          btnGradient: 'bg-slate-900 hover:bg-slate-800 text-white font-black',
          badgeText: 'text-purple-700 bg-purple-50 border-purple-200',
        };
      case 'devolucion_anulacion':
        return {
          gradient: 'from-rose-500 to-red-500',
          accentText: 'text-rose-700',
          borderHover: 'hover:border-rose-400',
          activeLeft: 'border-l-rose-500',
          iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
          btnGradient: 'bg-slate-900 hover:bg-slate-800 text-white font-black',
          badgeText: 'text-rose-700 bg-rose-50 border-rose-200',
        };
      default:
        return {
          gradient: 'from-amber-500 to-orange-500',
          accentText: 'text-amber-800',
          borderHover: 'hover:border-amber-400',
          activeLeft: 'border-l-amber-500',
          iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
          btnGradient: 'bg-slate-900 hover:bg-slate-800 text-white font-black',
          badgeText: 'text-amber-800 bg-amber-50 border-amber-200',
        };
    }
  }, [categoria?.id]);

  const cargarCargos = async () => {
    setLoading(true);
    try {
      const url = categoria?.id ? `${API_BASE_URL}/api/cargos?tipo=${categoria.id}` : `${API_BASE_URL}/api/cargos`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCargos(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error fetching cargos", e);
    } finally {
      setLoading(false);
    }
  };

  const getDisplayDescription = (item) => {
    let desc = item.descripcion || '';
    if (desc.includes('|||DOCS|||')) {
      desc = desc.split('|||DOCS|||')[0].trim();
    }
    return desc || item.asunto || '-';
  };

  useEffect(() => {
    cargarCargos();
  }, [categoria?.id]);

  const handleSaveCargo = async (nuevoCargo) => {
    let desc = categoria?.id === 'devolucion_anulacion' 
      ? '' 
      : (nuevoCargo?.descripcion || '');

    if (nuevoCargo?.docs && nuevoCargo.docs.length > 0) {
      const validDocs = nuevoCargo.docs.filter(d => d.trim() !== '');
      if (validDocs.length > 0) {
        desc = desc ? `${desc}|||DOCS|||${JSON.stringify(validDocs)}` : `|||DOCS|||${JSON.stringify(validDocs)}`;
      }
    }

    if (editCargo) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/cargos/${editCargo.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            tipo: categoria?.id || 'general',
            descripcion: desc,
            destinatario: nuevoCargo?.destinatario,
            remitente: nuevoCargo?.remitente,
            asunto: nuevoCargo?.asunto,
            fecha_registro_cargo: nuevoCargo?.fecha || new Date().toISOString().split('T')[0],
            usuario_registro: nuevoCargo?.usuario || 'Usuario Actual'
          })
        });
        if (res.ok) {
          await cargarCargos();
          setIsModalOpen(false);
          setEditCargo(null);
        } else {
          alert("Error al actualizar el cargo.");
        }
      } catch (e) {
        console.error("Error updating cargo", e);
        alert("Error de conexión: " + e.message);
      }
      return;
    }

    const formData = new FormData();
    formData.append('tipo', categoria?.id || 'general');
    formData.append('descripcion', desc);
    if (nuevoCargo?.destinatario) formData.append('destinatario', nuevoCargo.destinatario);
    if (nuevoCargo?.remitente) formData.append('remitente', nuevoCargo.remitente);
    if (nuevoCargo?.asunto) formData.append('asunto', nuevoCargo.asunto);
    formData.append('fecha_registro_cargo', nuevoCargo?.fecha || new Date().toISOString().split('T')[0]);
    formData.append('usuario_registro', nuevoCargo?.usuario || 'Usuario Actual');
    
    if (nuevoCargo?.archivos && nuevoCargo.archivos.length > 0) {
      nuevoCargo.archivos.forEach(file => {
        formData.append('archivos', file);
      });
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/cargos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      if (res.ok) {
        await cargarCargos();
        setIsModalOpen(false);
      } else {
        alert("Error al guardar el cargo.");
      }
    } catch (e) {
      console.error("Error saving cargo", e);
      alert("Error de conexión: " + e.message);
    }
  };

  const handleDeleteCargo = async (id) => {
    if (!window.confirm("¿Estás seguro que deseas eliminar permanentemente este cargo? Esta acción no se puede deshacer.")) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/cargos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await cargarCargos();
      } else {
        alert("Error al eliminar el cargo.");
      }
    } catch (e) {
      console.error("Error deleting cargo", e);
      alert("Error de conexión: " + e.message);
    }
  };

  const filteredCargos = useMemo(() => {
    const sorted = [...cargos].sort((a, b) => {
      const dateA = a.fecha_registro_cargo ? new Date(a.fecha_registro_cargo) : new Date(0);
      const dateB = b.fecha_registro_cargo ? new Date(b.fecha_registro_cargo) : new Date(0);
      return dateB - dateA;
    });

    if (!searchTerm.trim()) return sorted;
    const term = searchTerm.toLowerCase();
    return sorted.filter(c => 
      (c.codigo && c.codigo.toLowerCase().includes(term)) ||
      (c.descripcion && c.descripcion.toLowerCase().includes(term)) ||
      (c.asunto && c.asunto.toLowerCase().includes(term)) ||
      (c.usuario_registro && c.usuario_registro.toLowerCase().includes(term)) ||
      (c.destinatario && c.destinatario.toLowerCase().includes(term))
    );
  }, [cargos, searchTerm]);

  return (
    <div className="w-full space-y-4 pb-8">
      {/* Header Ejecutivo */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-slate-900 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <button 
            onClick={onBack}
            className="group inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs text-slate-700 hover:text-slate-950 font-bold uppercase tracking-wider transition-all"
          >
            <span className="w-4 h-4 rounded bg-slate-200/70 flex items-center justify-center font-mono text-slate-950 font-bold text-[10px]">
              ←
            </span> 
            <span>Volver a Cargos</span>
          </button>

          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs ${themeConfig.iconBg}`}>
              <div className="scale-90 origin-center">{categoria?.icon}</div>
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight uppercase flex items-center gap-2">
                {categoria?.title || 'Detalle de Cargo'}
              </h1>
              <p className={`text-xs font-semibold ${themeConfig.accentText}`}>
                Registros y Archivos Adjuntos
              </p>
            </div>
          </div>
        </div>

        {/* Botón Nuevo Cargo */}
        <button 
          onClick={() => {
            setEditCargo(null);
            setIsModalOpen(true);
          }}
          className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-2 w-full sm:w-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nuevo Cargo</span>
        </button>
      </div>

      {/* Modales */}
      <NuevoCargoModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setEditCargo(null);
        }} 
        onSave={handleSaveCargo}
        categoria={categoria}
        editCargo={editCargo}
      />

      <VerCargoModal 
        isOpen={!!viewCargo}
        onClose={() => setViewCargo(null)}
        cargo={viewCargo}
        categoria={categoria}
      />

      {/* Contenedor Principal */}
      <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl text-slate-900 shadow-xs">
        
        {/* Barra de Filtros y Búsqueda */}
        <div className="pb-3.5 border-b border-slate-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <div className={`w-1.5 h-4 rounded-full bg-gradient-to-b ${themeConfig.gradient} shadow-xs`}></div>
            <h2 className="text-xs font-black text-slate-950 uppercase tracking-wider">
              Lista de Registros
            </h2>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${themeConfig.badgeText}`}>
              {cargos.length} {cargos.length === 1 ? 'cargo' : 'cargos'}
            </span>
          </div>
          
          {/* Buscador */}
          <div className="relative w-full md:w-80">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, descripción..." 
              className="w-full bg-white border border-slate-200 rounded-xl pl-8.5 pr-8 py-1.5 text-xs font-medium text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs font-bold p-1"
              >
                ✕
              </button>
            )}
          </div>
        </div>
        
        {/* Tabla Interactiva de Cargos */}
        <div className="overflow-x-auto custom-scrollbar pt-3 pb-1">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-3 border-slate-200 border-t-slate-950 rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">Cargando registros...</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[900px] text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  <th className="pb-2 px-3 w-36">
                    CÓDIGO
                  </th>
                  <th className="pb-2 px-3">
                    DESCRIPCIÓN / ASUNTO
                  </th>
                  <th className="pb-2 px-3 w-40">
                    FECHA REGISTRO
                  </th>
                  <th className="pb-2 px-3 w-40">
                    REGISTRADO POR
                  </th>
                  <th className="pb-2 px-3 text-right w-36">
                    ACCIÓN
                  </th>
                </tr>
              </thead>
              <tbody className="text-slate-900 divide-y divide-slate-100">
                {filteredCargos.map((item, index) => (
                  <tr 
                    key={index} 
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* Código */}
                    <td className={`py-2.5 px-3 font-mono font-black text-xs tracking-wider text-slate-950`}>
                      <div className="flex items-center space-x-2">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center border transition-all ${themeConfig.iconBg}`}>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <span className="text-slate-950 font-bold">{item.codigo}</span>
                      </div>
                    </td>

                    {/* Descripción */}
                    <td className="py-2.5 px-3 font-medium text-xs text-slate-900">
                      <div className="line-clamp-2 leading-relaxed">
                        {getDisplayDescription(item)}
                      </div>
                    </td>

                    {/* Fecha de Registro */}
                    <td className="py-2.5 px-3 font-mono font-medium text-xs text-slate-600 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium text-[11px]">
                        <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{item.fecha_registro_cargo ? new Date(item.fecha_registro_cargo).toLocaleDateString('es-PE') : '-'}</span>
                      </span>
                    </td>

                    {/* Usuario Registro */}
                    <td className="py-2.5 px-3 font-semibold text-xs text-slate-700 uppercase tracking-wider whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <div className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold text-[10px]">
                          {item.usuario_registro ? item.usuario_registro.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span className="text-xs">{item.usuario_registro || '-'}</span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button 
                          onClick={() => {
                            setEditCargo(item);
                            setIsModalOpen(true);
                          }}
                          className="text-slate-600 hover:text-blue-600 transition-colors p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200"
                          title="Editar Registro"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => handleDeleteCargo(item.id)}
                          className="text-slate-600 hover:text-rose-600 transition-colors p-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-200"
                          title="Eliminar Registro"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => setViewCargo(item)}
                          className="text-xs text-white font-bold uppercase tracking-wider bg-slate-950 hover:bg-slate-900 px-2.5 py-1 rounded-lg flex items-center gap-1 ml-1 transition-all"
                        >
                          <span>Ver</span>
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredCargos.length === 0 && (
                  <tr>
                    <td colSpan="5" className="py-12 text-center">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 shadow-xs">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                          </svg>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-xs font-black text-slate-950 uppercase tracking-wider">
                            {searchTerm ? 'No se encontraron resultados' : 'No hay cargos registrados'}
                          </p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {searchTerm ? 'Intenta con otro término' : 'Haz clic en "+ Nuevo Cargo" para agregar uno'}
                          </p>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default CargosDetalle;
