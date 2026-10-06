import React, { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../../config/api';

const CarpetaArchivos = ({ expediente, carpeta, onBack }) => {
  const [archivosList, setArchivosList] = useState(carpeta?.archivos || []);
  const [activeSubcarpeta, setActiveSubcarpeta] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  
  // Estado para la Vista Previa dentro de la misma página
  const [archivoPreview, setArchivoPreview] = useState(null);
  
  const fileInputRef = useRef(null);

  const cargarArchivos = async () => {
    if (!expediente?.id) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/expedientes/${expediente.id}/archivos`);
      if (res.ok) {
        const data = await res.json();
        setArchivosList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error cargando archivos del expediente:', err);
    }
  };

  useEffect(() => {
    cargarArchivos();
  }, [expediente?.id]);

  const currentFolderName = carpeta?.nombre || '';
  const expectedPrefix = `${currentFolderName}/`;

  // Agrupar subcarpetas dinámicamente
  const subcarpetasObj = {};
  (Array.isArray(archivosList) ? archivosList : []).forEach(file => {
    if (file.nombre_original && file.nombre_original.startsWith(expectedPrefix)) {
      const subpath = file.nombre_original.substring(expectedPrefix.length);
      const parts = subpath.split('/');
      if (parts.length > 1) {
        const subName = parts[0];
        if (!subcarpetasObj[subName]) subcarpetasObj[subName] = 0;
        if (file.nombre_archivo !== '.placeholder') {
          subcarpetasObj[subName]++;
        }
      }
    }
  });

  const subcarpetasDinamicas = Object.keys(subcarpetasObj).map((key, i) => ({
    id: `sub-${i}`,
    nombre: key,
    items: `${subcarpetasObj[key]} ${subcarpetasObj[key] === 1 ? 'doc' : 'docs'}`,
    count: subcarpetasObj[key]
  }));

  const isEmpresaFolder = (() => {
    const nombre = (carpeta?.nombre || '').toUpperCase();
    if (nombre.startsWith('03') || nombre.startsWith('04') || nombre.startsWith('05')) return true;
    if (nombre.includes('EMPRESA') || nombre.includes('CONSORCIADO') || nombre.includes('INVERSIONES') || nombre.includes('CONSORCIO')) return true;
    if (subcarpetasDinamicas.length > 0) return true;
    return false;
  })();

  const archivosReales = (Array.isArray(archivosList) ? archivosList : []).filter(a => a.nombre_archivo !== '.placeholder');

  const archivosAMostrar = archivosReales.filter(archivo => {
    if (activeSubcarpeta) {
      const subPrefix = `${currentFolderName}/${activeSubcarpeta.nombre}/`;
      return archivo.nombre_original.startsWith(subPrefix);
    } else {
      if (!archivo.nombre_original.startsWith(expectedPrefix)) return false;
      const subpath = archivo.nombre_original.substring(expectedPrefix.length);
      return !subpath.includes('/');
    }
  });

  const renderDocumentIcon = (nombreOriginal, tipoMime) => {
    const ext = (nombreOriginal || '').split('.').pop().toLowerCase();
    
    if (ext === 'pdf' || tipoMime === 'application/pdf') {
      return (
        <div className="w-10 h-12 relative flex items-center justify-center">
          <svg className="w-10 h-12 drop-shadow-xs group-hover:scale-105 transition-transform" viewBox="0 0 56 68" fill="none">
            <path d="M0 8C0 3.58172 3.58172 0 8 0H36L56 20V60C56 64.4183 52.4183 68 48 68H8C3.58172 68 0 64.4183 0 60V8Z" fill="#fee2e2" />
            <path d="M36 0L56 20H44C39.5817 20 36 16.4183 36 12V0Z" fill="#fecaca" />
            <path d="M0 8C0 3.58172 3.58172 0 8 0H36L56 20V60C56 64.4183 52.4183 68 48 68H8C3.58172 68 0 64.4183 0 60V8Z" stroke="#ef4444" strokeWidth={1.5} />
            <rect x="10" y="32" width="36" height="22" rx="4" fill="#ef4444" />
            <text x="28" y="47" fill="white" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">PDF</text>
          </svg>
        </div>
      );
    } else if (ext === 'xlsx' || ext === 'xls' || (tipoMime && tipoMime.includes('spreadsheet'))) {
      return (
        <div className="w-10 h-12 relative flex items-center justify-center">
          <svg className="w-10 h-12 drop-shadow-xs group-hover:scale-105 transition-transform" viewBox="0 0 56 68" fill="none">
            <path d="M0 8C0 3.58172 3.58172 0 8 0H36L56 20V60C56 64.4183 52.4183 68 48 68H8C3.58172 68 0 64.4183 0 60V8Z" fill="#d1fae5" />
            <path d="M36 0L56 20H44C39.5817 20 36 16.4183 36 12V0Z" fill="#a7f3d0" />
            <path d="M0 8C0 3.58172 3.58172 0 8 0H36L56 20V60C56 64.4183 52.4183 68 48 68H8C3.58172 68 0 64.4183 0 60V8Z" stroke="#10b981" strokeWidth={1.5} />
            <rect x="10" y="32" width="36" height="22" rx="4" fill="#10b981" />
            <text x="28" y="47" fill="white" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">XLS</text>
          </svg>
        </div>
      );
    } else if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
      return (
        <div className="w-10 h-12 relative flex items-center justify-center">
          <svg className="w-10 h-12 drop-shadow-xs group-hover:scale-105 transition-transform" viewBox="0 0 56 68" fill="none">
            <path d="M0 8C0 3.58172 3.58172 0 8 0H36L56 20V60C56 64.4183 52.4183 68 48 68H8C3.58172 68 0 64.4183 0 60V8Z" fill="#dbeafe" />
            <path d="M36 0L56 20H44C39.5817 20 36 16.4183 36 12V0Z" fill="#bfdbfe" />
            <path d="M0 8C0 3.58172 3.58172 0 8 0H36L56 20V60C56 64.4183 52.4183 68 48 68H8C3.58172 68 0 64.4183 0 60V8Z" stroke="#3b82f6" strokeWidth={1.5} />
            <rect x="10" y="32" width="36" height="22" rx="4" fill="#3b82f6" />
            <text x="28" y="47" fill="white" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">IMG</text>
          </svg>
        </div>
      );
    } else {
      return (
        <div className="w-10 h-12 relative flex items-center justify-center">
          <svg className="w-10 h-12 drop-shadow-xs group-hover:scale-105 transition-transform" viewBox="0 0 56 68" fill="none">
            <path d="M0 8C0 3.58172 3.58172 0 8 0H36L56 20V60C56 64.4183 52.4183 68 48 68H8C3.58172 68 0 64.4183 0 60V8Z" fill="#f1f5f9" />
            <path d="M36 0L56 20H44C39.5817 20 36 16.4183 36 12V0Z" fill="#e2e8f0" />
            <path d="M0 8C0 3.58172 3.58172 0 8 0H36L56 20V60C56 64.4183 52.4183 68 48 68H8C3.58172 68 0 64.4183 0 60V8Z" stroke="#64748b" strokeWidth={1.5} />
            <rect x="10" y="32" width="36" height="22" rx="4" fill="#64748b" />
            <text x="28" y="47" fill="white" fontSize="11" fontWeight="900" fontFamily="sans-serif" textAnchor="middle" letterSpacing="0.5">DOC</text>
          </svg>
        </div>
      );
    }
  };

  const handleBack = () => {
    if (activeSubcarpeta) {
      setActiveSubcarpeta(null);
    } else {
      onBack();
    }
  };

  const handleCrearSubcarpeta = async (e) => {
    e.preventDefault();
    if (!newFolderName.trim() || isCreatingFolder) return;

    setIsCreatingFolder(true);
    try {
      const fullPath = `${currentFolderName}/${newFolderName.trim()}`;
      const res = await fetch(`${API_BASE_URL}/api/expedientes/${expediente.id}/carpetas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: fullPath })
      });

      if (res.ok) {
        toast.success(`Subcarpeta "${newFolderName.trim()}" creada con éxito.`);
        setNewFolderName('');
        setShowModal(false);
        await cargarArchivos();
      } else {
        toast.error('Error al crear la subcarpeta.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de red al crear la subcarpeta.');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const handleEliminarSubcarpeta = async (subNombre, e) => {
    e.stopPropagation();
    const targetName = `${currentFolderName}/${subNombre}`;
    if (window.confirm(`¿Estás seguro de eliminar la subcarpeta "${subNombre}" y todos sus archivos?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/expedientes/${expediente.id}/carpetas`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre: targetName })
        });
        if (res.ok) {
          toast.success('Subcarpeta eliminada');
          await cargarArchivos();
        } else {
          toast.error('Error al eliminar la subcarpeta');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error de red al eliminar');
      }
    }
  };

  const handleEliminarArchivo = async (archivoId, archivoNombre, e) => {
    e.stopPropagation();
    if (window.confirm(`¿Estás seguro de eliminar el archivo "${archivoNombre}"?`)) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/archivos/${archivoId}`, {
          method: 'DELETE'
        });
        if (res.ok) {
          toast.success('Archivo eliminado correctamente');
          await cargarArchivos();
        } else {
          toast.error('Error al eliminar archivo');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error de red al eliminar');
      }
    }
  };

  const handleAbrirPreview = (archivo) => {
    const urlPath = archivo.ruta.replace(/\\/g, '/');
    const finalUrl = `${API_BASE_URL}/${urlPath.startsWith('/') ? urlPath.substring(1) : urlPath}`;
    const cleanName = archivo.nombre_original.split('/').pop();
    const ext = cleanName.split('.').pop().toLowerCase();

    setArchivoPreview({
      ...archivo,
      url: finalUrl,
      cleanName,
      ext
    });
  };

  return (
    <div className="w-full space-y-4 pb-8 font-sans select-none text-slate-900">
      {/* Header Compacto */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-slate-900 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-2">
          <button 
            onClick={handleBack}
            className="group inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 hover:text-slate-950 hover:bg-slate-100 font-bold uppercase tracking-wider transition-all"
          >
            <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>{activeSubcarpeta ? 'Volver a Subcarpetas' : 'Volver al Expediente'}</span>
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-xs border border-amber-200/80">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4H4Z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black text-slate-950 tracking-tight uppercase">
                Carpeta: <span className="text-blue-600">{activeSubcarpeta ? activeSubcarpeta.nombre : (carpeta?.nombre || 'Archivos')}</span>
              </h1>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-[10px] uppercase tracking-wider font-bold text-slate-700">
                  Consorcio: <span className="text-blue-600 ml-1">{expediente?.consorcio || 'N/A'}</span>
                </span>
                {activeSubcarpeta && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-lg border border-amber-200/80 bg-amber-50 text-[10px] uppercase tracking-wider font-bold text-amber-800">
                    Padre: <span className="ml-1">{carpeta?.nombre}</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Botón de Acción Principal */}
        {isEmpresaFolder && !activeSubcarpeta ? (
          <button 
            onClick={() => { setNewFolderName(''); setShowModal(true); }}
            className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 w-full sm:w-auto active:scale-95"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>Nueva Carpeta</span>
          </button>
        ) : (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button 
              onClick={() => fileInputRef.current?.click()} 
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold tracking-wider uppercase px-4 py-2.5 rounded-xl transition-all shadow-xs flex items-center justify-center space-x-1.5 w-full sm:w-auto active:scale-95"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Subir Archivo</span>
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              multiple
              onChange={async (e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                
                const formData = new FormData();
                for(let i = 0; i < files.length; i++) {
                  formData.append('archivos', files[i]);
                }
                
                const folderName = activeSubcarpeta ? `${currentFolderName}/${activeSubcarpeta.nombre}` : currentFolderName;
                formData.append('carpeta', folderName);

                try {
                  const res = await fetch(`${API_BASE_URL}/api/expedientes/${expediente.id}/archivos`, {
                    method: 'POST',
                    body: formData
                  });
                  if (res.ok) {
                    toast.success('Archivos subidos exitosamente.');
                    await cargarArchivos();
                  } else {
                    toast.error('Error al subir archivos');
                  }
                } catch (err) {
                  console.error(err);
                  toast.error('Error de red al subir archivos');
                }
              }}
            />
          </div>
        )}
      </div>

      {/* VISTA 1: SUBCARPETAS */}
      {isEmpresaFolder && !activeSubcarpeta ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-amber-500 rounded-full"></span>
              Subcarpetas Internas ({subcarpetasDinamicas.length})
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
            {subcarpetasDinamicas.map((sub, idx) => (
              <div 
                key={sub.id}
                onClick={() => setActiveSubcarpeta(sub)}
                className="group relative bg-white border border-slate-200/80 rounded-2xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between shadow-2xs hover:border-blue-400 hover:shadow-md hover:-translate-y-0.5 overflow-hidden"
              >
                <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-purple-400 to-blue-500 opacity-60 group-hover:opacity-100 transition-opacity"></div>

                {/* Eliminar */}
                <button
                  onClick={(e) => handleEliminarSubcarpeta(sub.nombre, e)}
                  className="absolute top-3 right-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition-all opacity-0 group-hover:opacity-100 z-10"
                  title="Eliminar subcarpeta"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shadow-2xs">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4H4Z" />
                      </svg>
                    </div>

                    <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-50 border border-amber-200/80 px-2 py-0.5 rounded-lg uppercase tracking-wider">
                      {sub.items}
                    </span>
                  </div>

                  <div className="space-y-0.5 mb-3">
                    <p className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-widest">
                      #{String(idx + 1).padStart(2, '0')}
                    </p>
                    <h3 className="text-xs font-black text-slate-950 uppercase tracking-wide leading-snug group-hover:text-blue-600 transition-colors line-clamp-2" title={sub.nombre}>
                      {sub.nombre}
                    </h3>
                  </div>
                </div>

                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold uppercase text-slate-500 group-hover:text-blue-600 transition-colors">
                  <span>Explorar</span>
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            ))}

            {subcarpetasDinamicas.length === 0 && (
              <div className="col-span-full py-10 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-center flex flex-col items-center justify-center space-y-2">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 shadow-xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  No hay subcarpetas creadas en esta empresa.
                </p>
                <button
                  onClick={() => { setNewFolderName(''); setShowModal(true); }}
                  className="text-xs font-bold text-blue-600 hover:underline uppercase tracking-wider"
                >
                  + Haz clic en &quot;Nueva Carpeta&quot; para crear una
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VISTA 2: ARCHIVOS CON VISTA PREVIA INTEGRADA */
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-3.5 bg-rose-500 rounded-full"></span>
              Documentos Digitales ({archivosAMostrar.length})
            </span>
          </div>

          {/* Grid de Documentos Compactos */}
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8 gap-3 pt-1">
            {archivosAMostrar.map(archivo => {
              const cleanFileName = archivo.nombre_original.split('/').pop();

              return (
                <div 
                  key={archivo.id}
                  onClick={() => handleAbrirPreview(archivo)}
                  className="group relative flex flex-col items-center text-center p-3 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 shadow-2xs hover:shadow-sm transition-all duration-200 cursor-pointer select-none"
                >
                  {/* Botón Eliminar Flotante */}
                  <button
                    onClick={(e) => handleEliminarArchivo(archivo.id, cleanFileName, e)}
                    className="absolute top-1.5 right-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1 rounded-md transition-all opacity-0 group-hover:opacity-100 z-10"
                    title="Eliminar archivo"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>

                  {/* Icono de Archivo */}
                  <div className="my-1.5">
                    {renderDocumentIcon(archivo.nombre_original, archivo.tipo_mime || archivo.tipo)}
                  </div>

                  {/* Nombre del Archivo en Proporción Adecuada */}
                  <h3 className="w-full text-[11px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors uppercase tracking-tight line-clamp-2 leading-tight break-words mt-1" title={cleanFileName}>
                    {cleanFileName}
                  </h3>
                </div>
              );
            })}

            {archivosAMostrar.length === 0 && (
              <div className="col-span-full py-10 text-center flex flex-col items-center justify-center space-y-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 shadow-xs">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                  No hay archivos adjuntos en esta sección
                </p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-bold text-emerald-600 hover:underline uppercase tracking-wider"
                >
                  + Haz clic aquí para subir un archivo
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL DE VISTA PREVIA EN LA MISMA PÁGINA */}
      {archivoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6">
          <div 
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity"
            onClick={() => setArchivoPreview(null)}
          ></div>

          <div className="relative w-full max-w-5xl h-[88vh] bg-white border border-slate-200/80 rounded-[32px] shadow-2xl ring-1 ring-slate-200/60 overflow-hidden flex flex-col transform transition-all z-10 text-slate-900">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-purple-500 to-blue-500"></div>

            {/* Cabecera del Visor */}
            <div className="p-5 px-7 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center space-x-3.5 min-w-0 pr-4">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100 flex-shrink-0 shadow-xs">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.627 0-12 5.373-12 12s5.373 12 12 12 12-5.373 12-12-5.373-12-12-12zm-1.25 14.5c0 .828-.672 1.5-1.5 1.5h-1v-4h1c.828 0 1.5.672 1.5 1.5v1zm3.75-2.5h-2v4h2v-1h-1v-1h1v-2zm4.5 1h-2v3h-1v-4h3v1zm-8.25.5v1h-1v-1h1zm4.75-8.5v5l-5-5h5z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-black text-slate-950 uppercase tracking-wider truncate" title={archivoPreview.cleanName}>
                    {archivoPreview.cleanName}
                  </h3>
                  <p className="text-xs font-mono text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                    Vista previa de documento digital
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2.5 flex-shrink-0">
                <a
                  href={archivoPreview.url}
                  download={archivoPreview.cleanName}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 hover:text-slate-950 text-xs sm:text-sm font-bold uppercase tracking-wider transition-all shadow-xs"
                  title="Descargar archivo"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span className="hidden sm:inline">Descargar</span>
                </a>

                <button 
                  onClick={() => setArchivoPreview(null)}
                  className="w-9 h-9 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors font-bold flex items-center justify-center text-sm shadow-xs"
                  title="Cerrar visor"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Contenedor del Documento */}
            <div className="flex-1 bg-slate-50 p-2 sm:p-4 overflow-hidden flex items-center justify-center">
              {['pdf', 'application/pdf'].includes(archivoPreview.ext) || archivoPreview.cleanName.toLowerCase().endsWith('.pdf') ? (
                <iframe 
                  src={archivoPreview.url} 
                  title={archivoPreview.cleanName}
                  className="w-full h-full rounded-2xl border border-slate-200 bg-white shadow-xs"
                />
              ) : ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(archivoPreview.ext) ? (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img 
                    src={archivoPreview.url} 
                    alt={archivoPreview.cleanName} 
                    className="max-h-full max-w-full object-contain rounded-2xl shadow-xl"
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 p-8 text-center bg-white rounded-3xl border border-slate-200 max-w-md shadow-xl">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center border border-slate-200">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h4 className="text-base font-black text-slate-950 uppercase tracking-wider">
                    {archivoPreview.cleanName}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 font-medium">
                    Este tipo de archivo no admite vista previa directa en navegador. Puedes descargarlo para abrirlo en tu equipo.
                  </p>
                  <a
                    href={archivoPreview.url}
                    download={archivoPreview.cleanName}
                    className="bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold uppercase tracking-widest px-6 py-3 rounded-2xl shadow-md transition-all active:scale-95"
                  >
                    Descargar Archivo
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Nueva Subcarpeta */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity"
            onClick={() => setShowModal(false)}
          ></div>

          <div className="relative w-full max-w-md bg-white border border-slate-200/80 rounded-[32px] shadow-2xl ring-1 ring-slate-200/60 overflow-hidden flex flex-col transform transition-all z-10 text-slate-900">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 to-blue-500"></div>

            <form onSubmit={handleCrearSubcarpeta}>
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 shadow-xs">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-black text-slate-950 uppercase tracking-wider">
                    Crear Nueva Subcarpeta
                  </h3>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors font-bold flex items-center justify-center text-sm shadow-xs"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4 bg-white">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Nombre de la subcarpeta
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-4 text-amber-600 text-base">
                      <svg className="w-4.5 h-4.5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M4 4C2.89543 4 2 4.89543 2 6V18C2 19.1046 2.89543 20 4 20H20C21.1046 20 22 19.1046 22 18V8C22 6.89543 21.1046 6 20 6H12L10 4H4Z" />
                      </svg>
                    </span>
                    <input 
                      type="text" 
                      value={newFolderName}
                      onChange={(e) => setNewFolderName(e.target.value)}
                      required
                      autoFocus
                      className="w-full bg-white border border-slate-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all uppercase shadow-xs" 
                      placeholder="Ej. 01 VIGENCIA DE PODER" 
                    />
                  </div>
                  <p className="text-xs text-slate-500 font-medium">
                    Se creará dentro de: <span className="text-blue-600 font-bold">{carpeta?.nombre}</span>
                  </p>
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 rounded-2xl text-xs font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider transition-colors hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold tracking-wider uppercase px-6 py-2.5 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  {isCreatingFolder ? 'Creando...' : 'Crear Subcarpeta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarpetaArchivos;

