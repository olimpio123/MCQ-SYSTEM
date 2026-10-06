import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';

const VerCargoModal = ({ isOpen, onClose, cargo, categoria }) => {
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewFile(null);
    }
  }, [isOpen, cargo]);

  if (!isOpen || !cargo) return null;

  const fechaFormat = cargo.fecha_registro_cargo 
    ? new Date(cargo.fecha_registro_cargo).toLocaleDateString('es-PE') 
    : '-';
  
  let realDesc = cargo.descripcion || '';
  let docsList = [];
  
  if (realDesc.includes('|||DOCS|||')) {
    const parts = realDesc.split('|||DOCS|||');
    realDesc = parts[0];
    try {
      docsList = JSON.parse(parts[1]);
    } catch(e) {}
  }

  let archivosList = cargo.archivos || [];
  if (archivosList.length === 0 && cargo.archivo_nombre) {
    archivosList = [{
      archivo_nombre: cargo.archivo_nombre,
      archivo_ruta: cargo.archivo_ruta
    }];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content - White Luxury */}
      <div className="relative w-full max-w-4xl bg-white border border-slate-200/80 rounded-[32px] shadow-2xl ring-1 ring-slate-200/60 overflow-hidden flex flex-col transform transition-all text-slate-900">
        
        {/* Glow Effects */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-wider">
              Detalle del Cargo
            </h2>
            <p className="text-xs sm:text-sm text-blue-600 uppercase tracking-wider mt-0.5 font-bold flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2 shadow-xs animate-pulse"></span>
              {cargo.codigo}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 font-bold transition-all shadow-xs"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <div className="p-7 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar bg-white">
          
          <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha de Registro</p>
              <p className="text-sm sm:text-base font-black text-slate-950 font-mono">{fechaFormat}</p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registrado por</p>
              <p className="text-sm sm:text-base font-black text-slate-950">{cargo.usuario_registro || '-'}</p>
            </div>
          </div>

          <div className="space-y-4">
            {(cargo.destinatario || cargo.remitente) && (
              <div className="grid grid-cols-2 gap-6">
                {cargo.destinatario && (
                  <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">A (Destinatario)</p>
                    <p className="text-sm font-medium text-slate-950 whitespace-pre-wrap">{cargo.destinatario}</p>
                  </div>
                )}
                {cargo.remitente && (
                  <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">DE (Remitente)</p>
                    <p className="text-sm font-medium text-slate-950 whitespace-pre-wrap">{cargo.remitente}</p>
                  </div>
                )}
              </div>
            )}
            
            {cargo.asunto && (
              <div className="space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Asunto</p>
                <p className="text-sm font-medium text-slate-950 whitespace-pre-wrap">{cargo.asunto}</p>
              </div>
            )}
            
            {realDesc && realDesc !== cargo.asunto && (
              <div className="space-y-1">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Descripción</p>
                <div className="text-sm font-medium text-slate-950 whitespace-pre-wrap bg-slate-50 p-4 rounded-2xl border border-slate-200 shadow-xs">
                  {realDesc}
                </div>
              </div>
            )}

            {docsList.length > 0 && (
              <div className="space-y-2 mt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Documentos Adjuntados (Físicos)</p>
                <div className="space-y-2">
                  {docsList.map((doc, idx) => (
                    <div key={idx} className="flex items-center space-x-3 bg-slate-50 border border-slate-200 p-3.5 rounded-2xl shadow-xs">
                      <span className="bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-xl uppercase tracking-wider whitespace-nowrap border border-blue-100 shadow-xs">
                        ITEM {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-950 w-full">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Archivos Adjuntos</p>
            {archivosList.length > 0 ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {archivosList.map((file, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setPreviewFile(previewFile === file ? null : file)}
                      className={`w-full flex items-center p-3.5 rounded-2xl border transition-all text-left ${
                        previewFile === file 
                          ? 'bg-blue-50 border-blue-400 shadow-xs ring-1 ring-blue-400' 
                          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-xs'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mr-3 text-blue-600 border border-blue-100 flex-shrink-0">
                        📄
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-bold text-slate-950 truncate">{file.archivo_nombre || `Archivo ${idx + 1}`}</p>
                        <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-0.5">
                          {previewFile === file ? 'Ocultar vista previa' : 'Click para ver'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                {previewFile && (
                  <div className="w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-200 flex justify-center items-center p-2 mt-3 shadow-xs" style={{ minHeight: '300px' }}>
                    {previewFile.archivo_ruta?.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                      <img 
                        src={`${API_BASE_URL}/${previewFile.archivo_ruta?.replace(/\\/g, '/')}`} 
                        className="max-w-full max-h-[75vh] object-contain rounded-xl shadow-md"
                        alt="Vista Previa"
                      />
                    ) : (
                      <iframe 
                        src={`${API_BASE_URL}/${previewFile.archivo_ruta?.replace(/\\/g, '/')}`} 
                        className="w-full h-[75vh] border-0 rounded-xl bg-white shadow-xs"
                        title="Vista Previa de Documento"
                      ></iframe>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-500 text-sm font-medium">
                No hay archivos adjuntos para este cargo.
              </div>
            )}
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center">
          <button 
            onClick={() => {
              setPreviewFile(null);
              onClose();
            }}
            className="px-6 py-2.5 text-xs sm:text-sm font-bold text-slate-700 hover:text-slate-950 uppercase tracking-wider transition-all rounded-2xl bg-white hover:bg-slate-100 border border-slate-200 shadow-xs"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerCargoModal;

