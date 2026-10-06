import React, { useState, useEffect } from 'react';

const NuevoCargoModal = ({ isOpen, onClose, onSave, categoria, editCargo }) => {
  const [docs, setDocs] = useState(['']);
  const [archivos, setArchivos] = useState([]);
  const [formData, setFormData] = useState({
    destinatario: '',
    remitente: '',
    fecha: new Date().toISOString().split('T')[0],
    usuario: '',
    asunto: '',
    descripcion: ''
  });

  useEffect(() => {
    if (isOpen) {
      if (editCargo) {
        let realDesc = editCargo.descripcion || '';
        let initialDocs = [''];
        if (realDesc.includes('|||DOCS|||')) {
          const parts = realDesc.split('|||DOCS|||');
          realDesc = parts[0];
          try {
            initialDocs = JSON.parse(parts[1]);
            if (initialDocs.length === 0) initialDocs = [''];
          } catch(e) {}
        }

        setDocs(initialDocs);
        setArchivos([]);
        setFormData({
          destinatario: editCargo.destinatario || '',
          remitente: editCargo.remitente || '',
          fecha: editCargo.fecha_registro_cargo ? new Date(editCargo.fecha_registro_cargo).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          usuario: editCargo.usuario_registro || '',
          asunto: editCargo.asunto || '',
          descripcion: realDesc
        });
      } else {
        setDocs(['']);
        setArchivos([]);
        setFormData({
          destinatario: '',
          remitente: '',
          fecha: new Date().toISOString().split('T')[0],
          usuario: '',
          asunto: '',
          descripcion: ''
        });
      }
    }
  }, [isOpen, editCargo]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    if (onSave) {
      onSave({ ...formData, docs, archivos });
    }
  };

  const addDoc = () => setDocs([...docs, '']);
  const updateDoc = (idx, val) => {
    const newDocs = [...docs];
    newDocs[idx] = val;
    setDocs(newDocs);
  };
  const removeDoc = (idx) => {
    if (docs.length > 1) {
      setDocs(docs.filter((_, i) => i !== idx));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content - White Luxury */}
      <div className="relative w-full max-w-xl bg-white border border-slate-200/80 rounded-[32px] shadow-2xl ring-1 ring-slate-200/60 overflow-hidden flex flex-col transform transition-all text-slate-900">
        
        {/* Top Glow bar */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500"></div>

        {/* Header */}
        <div className="px-7 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <div>
            <h2 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-wider">
              {editCargo ? 'Editar Cargo' : 'Registrar Nuevo Cargo'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-600 uppercase tracking-wider mt-0.5 font-bold flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 mr-2 shadow-xs animate-pulse"></span>
              Tipo: {categoria?.title || 'Cargo'}
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
          
          {categoria?.id === 'devolucion_anulacion' ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">A (Destinatario):</label>
                  <input 
                    type="text" 
                    name="destinatario"
                    value={formData.destinatario}
                    onChange={handleChange}
                    placeholder="Destinatario"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">DE (Remitente):</label>
                  <input 
                    type="text" 
                    name="remitente"
                    value={formData.remitente}
                    onChange={handleChange}
                    placeholder="Remitente"
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fecha de Registro</label>
                  <input 
                    type="date" 
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-950 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Persona que Registró</label>
                  <input 
                    type="text" 
                    name="usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez" 
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Asunto</label>
                <textarea 
                  name="asunto"
                  value={formData.asunto}
                  onChange={handleChange}
                  placeholder="Describa el asunto de este cargo..." 
                  rows="3"
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all resize-none"
                ></textarea>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Documentos Adjuntados</label>
                  <button 
                    onClick={addDoc}
                    type="button"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 uppercase tracking-wider flex items-center space-x-1"
                  >
                    <span>+ Agregar Documento</span>
                  </button>
                </div>
                
                <div className="space-y-2">
                  {docs.map((doc, idx) => (
                    <div key={idx} className="flex items-center space-x-2 group">
                      <div className="flex-shrink-0 bg-blue-50 text-blue-700 font-bold text-xs px-3.5 py-3 rounded-2xl border border-blue-100 shadow-xs">
                        ITEM {idx + 1}
                      </div>
                      <input 
                        type="text" 
                        placeholder="Nombre o descripción del documento"
                        value={doc}
                        onChange={(e) => updateDoc(idx, e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
                      />
                      {docs.length > 1 && (
                        <button 
                          onClick={() => removeDoc(idx)}
                          type="button"
                          className="text-rose-600 hover:text-rose-800 p-2 font-bold"
                          title="Eliminar documento"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="pt-2 space-y-3">
                  {archivos.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Archivos Seleccionados ({archivos.length})</p>
                      <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                        {archivos.map((file, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5">
                            <span className="text-xs sm:text-sm font-medium text-slate-950 truncate max-w-[80%]">{file.name}</span>
                            <button 
                              type="button"
                              onClick={() => setArchivos(archivos.filter((_, i) => i !== idx))}
                              className="text-rose-600 hover:text-rose-800 text-xs font-bold px-2 py-1"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <label className="block w-full border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 rounded-2xl p-5 flex flex-col items-center justify-center transition-all cursor-pointer group shadow-xs">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 border border-blue-100 shadow-xs">
                      <span className="text-lg">📎</span>
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider text-center">
                      Adjuntar Más Archivos (PDF, JPG, PNG)
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">Puedes seleccionar varios</span>
                    <input type="file" accept=".pdf, image/jpeg, image/png, image/webp" multiple className="hidden" onChange={(e) => {
                      if (e.target.files) {
                        setArchivos([...archivos, ...Array.from(e.target.files)]);
                      }
                    }} />
                  </label>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Fecha de Registro</label>
                  <input 
                    type="date" 
                    name="fecha"
                    value={formData.fecha}
                    onChange={handleChange}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-950 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all cursor-pointer"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Persona que Registró</label>
                  <input 
                    type="text" 
                    name="usuario"
                    value={formData.usuario}
                    onChange={handleChange}
                    placeholder="Ej: Juan Pérez" 
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-medium text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Descripción</label>
                <textarea 
                  name="descripcion"
                  value={formData.descripcion}
                  onChange={handleChange}
                  placeholder="Describa el detalle de este cargo..." 
                  rows="3"
                  className="w-full bg-white border border-slate-200 rounded-2xl p-4 text-sm font-medium text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all resize-none"
                ></textarea>
              </div>

              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Documentos Adjuntos</label>
                
                {archivos.length > 0 && (
                  <div className="space-y-2">
                    <div className="space-y-1.5 max-h-32 overflow-y-auto custom-scrollbar pr-2">
                      {archivos.map((file, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2.5">
                          <span className="text-xs sm:text-sm font-medium text-slate-950 truncate max-w-[80%]">{file.name}</span>
                          <button 
                            type="button"
                            onClick={() => setArchivos(archivos.filter((_, i) => i !== idx))}
                            className="text-rose-600 hover:text-rose-800 text-xs font-bold px-2 py-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <label className="block w-full border-2 border-dashed border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 rounded-2xl p-5 flex flex-col items-center justify-center transition-all cursor-pointer group shadow-xs">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 border border-blue-100 shadow-xs">
                    <span className="text-lg">📎</span>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wider text-center">
                    Adjuntar Archivos (PDF, JPG, PNG)
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">Puedes seleccionar varios</span>
                  <input type="file" accept=".pdf, image/jpeg, image/png, image/webp" multiple className="hidden" onChange={(e) => {
                    if (e.target.files) {
                      setArchivos([...archivos, ...Array.from(e.target.files)]);
                    }
                  }} />
                </label>
              </div>
            </>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center space-x-3">
          <button 
            onClick={onClose}
            className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider transition-colors hover:bg-slate-100 rounded-2xl"
          >
            Cancelar
          </button>
          <button 
            onClick={handleSave}
            className="bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold tracking-wider uppercase px-7 py-3 rounded-2xl transition-all shadow-md active:scale-95"
          >
            <span>{editCargo ? 'Actualizar Cargo' : 'Registrar Cargo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default NuevoCargoModal;

