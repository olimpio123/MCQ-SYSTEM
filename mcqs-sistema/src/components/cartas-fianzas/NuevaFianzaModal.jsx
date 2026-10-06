import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import toast from 'react-hot-toast';

const NuevaFianzaModal = ({ isOpen, onClose, onSuccess, consorcioPreseleccionado, empresaId, editData }) => {
  if (!isOpen) return null;

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    numero: editData?.numero || '',
    monto: editData?.monto || '',
    moneda: editData?.moneda || 'PEN',
    tipo: editData?.tipo || 'fiel_cumplimiento',
    fecha_inicio: formatDateForInput(editData?.fecha_inicio) || new Date().toISOString().split('T')[0],
    fecha_vencimiento: formatDateForInput(editData?.fecha_vencimiento) || '',
    observacion: editData?.observacion || ''
  });
  
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tiposGarantia = [
    { 
      id: 'fiel_cumplimiento', 
      label: 'Fiel Cumplimiento', 
      tag: 'Garantía de Contrato',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      activeBorder: 'border-blue-600 bg-blue-50/80 shadow-md',
      activeRing: 'bg-blue-600'
    },
    { 
      id: 'adelanto_materiales', 
      label: 'Adelanto Materiales', 
      tag: 'Garantía por Materiales',
      icon: (
        <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      activeBorder: 'border-purple-600 bg-purple-50/80 shadow-md',
      activeRing: 'bg-purple-600'
    },
    { 
      id: 'adelanto_directo', 
      label: 'Adelanto Directo', 
      tag: 'Garantía por Desembolso',
      icon: (
        <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      activeBorder: 'border-amber-600 bg-amber-50/80 shadow-md',
      activeRing: 'bg-amber-600'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          numero: editData.numero || '',
          monto: editData.monto || '',
          moneda: editData.moneda || 'PEN',
          tipo: editData.tipo || 'fiel_cumplimiento',
          fecha_inicio: formatDateForInput(editData.fecha_inicio),
          fecha_vencimiento: formatDateForInput(editData.fecha_vencimiento),
          observacion: editData.observacion || ''
        });
      } else {
        setFormData({
          numero: '',
          monto: '',
          moneda: 'PEN',
          tipo: 'fiel_cumplimiento',
          fecha_inicio: new Date().toISOString().split('T')[0],
          fecha_vencimiento: '',
          observacion: ''
        });
      }
      setFile(null);
    }
  }, [isOpen, editData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => {
        if (formData[key] !== null && formData[key] !== undefined) {
          data.append(key, formData[key]);
        }
      });
      if (file) data.append('archivo', file);
      
      if (empresaId) data.append('empresa_id', empresaId);

      const url = editData ? `${API_BASE_URL}/api/fianzas/${editData.id}` : `${API_BASE_URL}/api/fianzas`;
      const method = editData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: data,
      });

      if (response.ok) {
        toast.success(editData ? 'Carta Fianza actualizada exitosamente.' : 'Carta Fianza guardada exitosamente.');
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      } else {
        const errJson = await response.json().catch(() => ({}));
        toast.error(errJson.error || 'Error al guardar la fianza.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de red al guardar.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Light blurred overlay */}
      <div 
        className="absolute inset-0 bg-slate-950/20 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Window */}
      <div className="relative w-full max-w-2xl bg-white rounded-[32px] border border-slate-200 shadow-2xl overflow-hidden flex flex-col text-slate-900 ring-1 ring-slate-200/80">
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          
          {/* Header */}
          <div className="p-6 sm:p-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shadow-xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-950 uppercase tracking-wider">
                  {editData ? 'Editar Carta Fianza' : 'Registrar Nueva Fianza'}
                </h3>
                {consorcioPreseleccionado && (
                  <div className="inline-flex items-center gap-1.5 mt-0.5 text-xs text-blue-700 font-bold">
                    <span>{consorcioPreseleccionado}</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 hover:text-slate-950 flex items-center justify-center text-sm font-black transition-all shadow-xs border border-slate-200"
            >
              ✕
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 sm:p-7 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            
            {/* 1. Modalidad */}
            <div className="space-y-2.5">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Tipo de Garantía (Modalidad)
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {tiposGarantia.map(tipo => {
                  const isSelected = formData.tipo === tipo.id;
                  return (
                    <div
                      key={tipo.id}
                      onClick={() => setFormData({ ...formData, tipo: tipo.id })}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected 
                          ? `${tipo.activeBorder} scale-[1.02]` 
                          : 'bg-white border-slate-200 hover:border-blue-400 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shadow-xs">
                          {tipo.icon}
                        </div>
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isSelected ? 'border-slate-950 bg-slate-950' : 'border-slate-300'}`}></div>
                      </div>

                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-950 uppercase leading-snug">{tipo.label}</h4>
                        <p className="text-[10px] text-slate-500 uppercase mt-0.5 font-bold">{tipo.tag}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 2. N° de Fianza & Monto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  N° de Carta Fianza
                </label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. 15412-0545-2025-001"
                  value={formData.numero}
                  onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono font-black text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Monto y Moneda
                </label>
                <div className="flex space-x-2">
                  <select 
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                    className="bg-white border border-slate-200 rounded-2xl px-3.5 py-3 text-sm font-black text-slate-950 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs"
                  >
                    <option value="PEN">S/ (PEN)</option>
                    <option value="USD">$ (USD)</option>
                  </select>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono font-black text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 3. Fechas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Fecha de Emisión
                </label>
                <input 
                  type="date" 
                  value={formData.fecha_inicio}
                  onChange={(e) => setFormData({ ...formData, fecha_inicio: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                  Fecha de Vencimiento
                </label>
                <input 
                  type="date" 
                  required
                  value={formData.fecha_vencimiento}
                  onChange={(e) => setFormData({ ...formData, fecha_vencimiento: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs"
                />
              </div>
            </div>

            {/* 4. Subir PDF */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Adjuntar Documento Digital (PDF)
              </label>
              <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/50 hover:bg-slate-50 hover:border-blue-400 transition-all">
                <input 
                  type="file" 
                  accept=".pdf,image/*"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                  className="w-full text-sm text-slate-700 file:mr-3.5 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-black file:bg-slate-950 file:text-white hover:file:bg-slate-900 cursor-pointer"
                />
              </div>
            </div>

            {/* 5. Observación */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
                Observaciones (Opcional)
              </label>
              <textarea 
                rows={2}
                placeholder="Ingresa notas o comentarios..."
                value={formData.observacion}
                onChange={(e) => setFormData({ ...formData, observacion: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-2xl p-3.5 text-sm font-bold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs resize-none transition-all"
              />
            </div>

          </div>

          {/* Footer Actions */}
          <div className="p-5 sm:p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center space-x-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-black text-slate-600 hover:text-slate-950 uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-black uppercase tracking-wider px-6 py-3 rounded-2xl transition-all shadow-md active:scale-95 border border-slate-800"
            >
              {isSubmitting ? 'Guardando...' : (editData ? 'Actualizar Fianza' : 'Guardar Fianza')}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

export default NuevaFianzaModal;

