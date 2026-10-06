import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

const ExpedienteDetalle = ({ expediente, onBack, onOpenCarpeta }) => {
  const [showModal, setShowModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [carpetas, setCarpetas] = useState([]);
  const [archivos, setArchivos] = useState([]);
  const [refreshKey, setRefreshKey] = useState(0);

  const cargarDatos = () => {
    if (expediente?.id) {
      setIsLoading(true);
      fetch(`${API_BASE_URL}/api/expedientes/${expediente.id}/archivos`)
        .then(res => res.json())
        .then(data => {
          setArchivos(Array.isArray(data) ? data : []);
          
          // Agrupar por nombre de carpeta
          const grupos = {};
          (Array.isArray(data) ? data : []).forEach(file => {
            const parts = file.nombre_original.split('/');
            const carpetaName = parts.length > 1 ? parts[0] : 'Archivos Sueltos';
            
            if (!grupos[carpetaName]) grupos[carpetaName] = [];
            grupos[carpetaName].push(file);
          });

          // Convertir a lista de carpetas
          const carpetasArray = Object.keys(grupos).map((key, i) => {
            const archivosReales = grupos[key].filter(f => f.nombre_archivo !== '.placeholder');
            return {
              id: i + 1,
              nombre: key,
              totalArchivos: archivosReales.length,
              items: `${archivosReales.length} ${archivosReales.length === 1 ? 'doc' : 'docs'}`,
              archivos: grupos[key]
            };
          });
          
          setCarpetas(carpetasArray);
        })
        .catch(err => console.error("Error trayendo archivos:", err))
        .finally(() => setIsLoading(false));
    }
  };

  useEffect(() => {
    cargarDatos();
  }, [expediente?.id, refreshKey]);

  const handleCrearCarpeta = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/expedientes/${expediente.id}/carpetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: newFolderName.trim() })
      });

      if (res.ok) {
        toast.success(`Carpeta "${newFolderName.trim()}" creada exitosamente.`);
        setNewFolderName('');
        setShowModal(false);
        setRefreshKey(prev => prev + 1);
      } else {
        toast.error('Error al crear la carpeta.');
      }
    } catch (err) {
      console.error(err);
      toast.error('Error de red al crear la carpeta.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEliminarCarpeta = async (carpetaNombre, e) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar la carpeta "${carpetaNombre}" y todo su contenido?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/expedientes/${expediente.id}/carpetas`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: carpetaNombre })
        });
        if (res.ok) {
          toast.success('Carpeta eliminada correctamente');
          setRefreshKey(prev => prev + 1);
        } else {
          toast.error('Error al eliminar la carpeta');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error de red al eliminar la carpeta');
      }
    }
  };

  const totalArchivosExpediente = archivos.filter(a => a.nombre_archivo !== '.placeholder').length;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8 font-sans select-none text-slate-800">
      {/* Header Compacto */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-bold uppercase tracking-wider transition-all border border-slate-200/80 shadow-2xs"
          >
            <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Volver</span>
          </button>
          
          <div className="h-6 w-px bg-slate-200"></div>

          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase leading-none">
              {expediente?.consorcio || 'Expediente'}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                {carpetas.length} {carpetas.length === 1 ? 'Carpeta' : 'Carpetas'}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                {totalArchivosExpediente} {totalArchivosExpediente === 1 ? 'Documento' : 'Documentos'}
              </span>
            </div>
          </div>
        </div>

        {/* Botón Nueva Carpeta */}
        <button 
          onClick={() => { setNewFolderName(''); setShowModal(true); }}
          className="bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider px-4 py-2 rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 active:scale-98"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          <span>Nueva Carpeta</span>
        </button>
      </div>

      {/* Grid de Carpetas */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white/80 rounded-2xl p-4 border border-slate-200/80 animate-pulse min-h-[140px] flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-slate-200 rounded-xl"></div>
                <div className="w-12 h-4 bg-slate-200 rounded"></div>
              </div>
              <div className="space-y-1.5">
                <div className="w-8 h-2.5 bg-slate-200 rounded"></div>
                <div className="w-3/4 h-4 bg-slate-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {carpetas.map((carpeta, idx) => (
            <div 
              key={carpeta.id} 
              onClick={() => onOpenCarpeta && onOpenCarpeta(carpeta)}
              className="group relative bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 min-h-[140px]"
            >
              <button
                onClick={(e) => handleEliminarCarpeta(carpeta.nombre, e)}
                className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10 hover:bg-slate-50"
                title="Eliminar carpeta"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>

              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shadow-2xs">
                    <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4H4Z" />
                    </svg>
                  </div>

                  <span className="font-mono text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-lg">
                    {carpeta.items}
                  </span>
                </div>

                <div className="space-y-0.5">
                  <p className="text-[9px] font-mono text-slate-400 uppercase font-bold">#{String(idx + 1).padStart(2, '0')}</p>
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-tight leading-snug group-hover:text-blue-600 transition-colors line-clamp-2" title={carpeta.nombre}>
                    {carpeta.nombre}
                  </h3>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] uppercase font-bold text-slate-400 group-hover:text-slate-800 transition-colors">
                <span>Abrir</span>
                <span className="font-bold">→</span>
              </div>
            </div>
          ))}

          {carpetas.length === 0 && (
            <div className="col-span-full py-10 bg-white/90 rounded-2xl border border-slate-200/80 text-center text-xs text-slate-400 uppercase tracking-wider font-bold">
              No hay carpetas creadas en este expediente.
            </div>
          )}
        </div>
      )}

      {/* Modal Nueva Carpeta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-[32px] shadow-2xl overflow-hidden flex flex-col text-slate-900 z-10 ring-1 ring-slate-200/60">
            <form onSubmit={handleCrearCarpeta}>
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <h3 className="text-base font-black text-slate-950 uppercase tracking-wider">
                  Crear Nueva Carpeta
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 hover:bg-slate-200 flex items-center justify-center text-sm font-bold transition-all shadow-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-3 bg-white">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Nombre de la carpeta
                </label>
                <input 
                  type="text" 
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 uppercase shadow-xs" 
                  placeholder="Ej. 05 DOCUMENTOS COMPLEMENTARIOS" 
                />
              </div>

              <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isCreating || !newFolderName.trim()}
                  className="bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold px-6 py-2.5 rounded-2xl uppercase tracking-wider transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isCreating ? 'Creando...' : 'Crear Carpeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpedienteDetalle;

