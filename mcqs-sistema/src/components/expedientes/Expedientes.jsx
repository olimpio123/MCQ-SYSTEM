import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api';
import toast from 'react-hot-toast';

const Expedientes = ({ onOpenExpediente }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const fileInputRef = useRef(null);

  const [expedientes, setExpedientes] = useState([]);

  const cargarExpedientes = () => {
    fetch(`${API_BASE_URL}/api/expedientes`)
      .then(res => res.json())
      .then(data => {
        setExpedientes(Array.isArray(data) ? data : []);
      })
      .catch(err => {
        console.error("Error al traer expedientes:", err);
        setExpedientes([]);
      });
  };

  useEffect(() => {
    cargarExpedientes();
  }, []);

  const filteredExpedientes = (Array.isArray(expedientes) ? expedientes : []).filter(exp => 
    (exp.consorcio?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
    (exp.empresa?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    (exp.nombre_proyecto?.toLowerCase() || '').includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-8 transition-colors">
      {/* Header y Acciones - Minimalist */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            Gestión de <span className="text-blue-600">Empresas</span>
          </h1>
          <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">Administración de Expedientes y Documentos</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="w-3.5 h-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="BUSCAR EMPRESA..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-slate-900 font-bold text-[11px] uppercase tracking-wider pl-8 pr-3 py-2 w-full sm:w-56 rounded-xl focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 transition-all shadow-2xs placeholder-slate-400"
            />
          </div>
          <button 
            onClick={() => {
              setNuevoNombre('');
              setShowModal(true);
            }} 
            className="bg-slate-50 hover:bg-slate-100 text-slate-800 text-[11px] font-bold tracking-wider uppercase px-3.5 py-2 transition-all border border-slate-200/80 flex items-center gap-1.5 rounded-xl shadow-2xs active:scale-98"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 4v16m8-8H4" />
            </svg>
            <span>Crear Manual</span>
          </button>
          <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold tracking-wider uppercase px-4 py-2 transition-all shadow-xs flex items-center gap-1.5 rounded-xl active:scale-98">
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span>Importar Carpeta</span>
          </button>
          {/* Input oculto para subir carpetas completas */}
          <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            webkitdirectory="true" 
            directory="true" 
            multiple 
            onChange={async (e) => {
              const files = e.target.files;
              if (!files || files.length === 0) return;

              const firstFilePath = files[0].webkitRelativePath || '';
              const folderName = firstFilePath.split('/')[0] || 'Carpeta Importada';

              const confirm = window.confirm(`¿Deseas procesar e importar la carpeta "${folderName}" con ${files.length} archivos?`);
              if (!confirm) return;

              const formData = new FormData();
              formData.append('folderName', folderName);
              
              for (let i = 0; i < files.length; i++) {
                formData.append('archivos', files[i]);
                formData.append('rutas', files[i].webkitRelativePath);
              }

              try {
                const res = await fetch(`${API_BASE_URL}/api/expedientes/import`, {
                  method: 'POST',
                  body: formData
                });
                
                if (res.ok) {
                  toast.success('Carpeta importada exitosamente.');
                  cargarExpedientes();
                } else {
                  const errData = await res.json();
                  toast.error(`Error: ${errData.error || 'No se pudo importar'}`);
                }
              } catch (err) {
                console.error(err);
                toast.error('Error de red al importar.');
              }
            }}
          />
        </div>
      </div>

      {/* Grid de Expedientes */}
      {filteredExpedientes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 bg-white/90 border border-slate-200/80 rounded-2xl">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-xs font-bold text-slate-800 tracking-wider uppercase mb-1">No hay empresas registradas</h3>
          <p className="text-[11px] text-slate-500 font-medium">Usa los botones superiores para crear o importar empresas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredExpedientes.map(exp => (
            <div 
              key={exp.id} 
              onClick={() => onOpenExpediente(exp)}
              className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-4.5 shadow-2xs hover:shadow-md hover:border-blue-300 hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group flex flex-col justify-between min-h-[140px] relative overflow-hidden"
            >
              {/* Header de la Card */}
              <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center border border-blue-100 group-hover:scale-105 transition-transform">
                  <svg className="w-4.5 h-4.5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4H4Z" />
                  </svg>
                </div>
                <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                  Empresa
                </span>
              </div>
              
              <div className="relative z-10 flex-1">
                <h3 className="font-bold text-xs text-slate-900 mb-1 uppercase tracking-tight line-clamp-2 leading-snug group-hover:text-blue-600 transition-colors">
                  {exp.consorcio || exp.empresa || exp.nombre_proyecto || 'Empresa sin nombre'}
                </h3>
              </div>
              
              <div className="mt-3 pt-2.5 border-t border-slate-100 flex justify-between items-center text-[10px] font-mono relative z-10">
                <span className="text-slate-400 font-bold">{exp.codigo || 'EXP-S/N'}</span>
                <span className="font-bold text-emerald-600">S/ {exp.monto_proyecto || '0.00'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear Manual */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 border border-gray-300 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden m-4 transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center transition-colors">
              <h3 className="text-sm font-extrabold text-black dark:font-bold dark:text-white tracking-[0.2em] uppercase transition-colors">Crear Nueva Empresa</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white font-bold transition-colors">✕</button>
            </div>
            <div className="p-6 space-y-4 transition-colors">
              <div className="space-y-2">
                <label className="text-[10px] font-extrabold text-gray-800 dark:font-bold dark:text-gray-400 uppercase tracking-widest transition-colors">Nombre de la Empresa o Consorcio</label>
                <input 
                  type="text" 
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      document.getElementById('btnCrearEmpresaManual')?.click();
                    }
                  }}
                  className="w-full bg-gray-50 dark:bg-black/20 border border-gray-300 dark:border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-black dark:font-normal dark:text-white focus:outline-none focus:border-blue-600 dark:focus:border-blue-400 transition-colors placeholder-gray-400" 
                  placeholder="Ej. Consorcio Los Andes..." 
                  autoFocus
                />
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-white/10 flex justify-end gap-4 transition-colors">
              <button onClick={() => setShowModal(false)} className="text-[10px] text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white uppercase tracking-widest font-extrabold dark:font-bold transition-colors">Cancelar</button>
              <button 
                id="btnCrearEmpresaManual"
                disabled={isCreating}
                onClick={async () => {
                  if (!nuevoNombre.trim()) {
                    toast.error('Ingrese el nombre de la empresa');
                    return;
                  }
                  setIsCreating(true);
                  try {
                    const res = await fetch(`${API_BASE_URL}/api/expedientes`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ nombre_proyecto: nuevoNombre.trim() })
                    });
                    if (res.ok) {
                      toast.success('Empresa creada exitosamente');
                      setShowModal(false);
                      setNuevoNombre('');
                      cargarExpedientes();
                    } else {
                      const data = await res.json();
                      toast.error(data.error || 'Error al crear la empresa');
                    }
                  } catch (e) {
                    console.error(e);
                    toast.error('Error de conexión');
                  } finally {
                    setIsCreating(false);
                  }
                }} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-extrabold px-6 py-2.5 rounded-xl uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
              >
                {isCreating ? 'Creando...' : 'Crear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expedientes;
