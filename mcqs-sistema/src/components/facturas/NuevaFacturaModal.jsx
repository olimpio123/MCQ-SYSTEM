import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';
import toast from 'react-hot-toast';

const NuevaFacturaModal = ({ isOpen, onClose, onSuccess, consorcioPreseleccionado, empresaId, editData, prefilledData }) => {
  if (!isOpen) return null;

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    numero: editData?.numero || '',
    monto: editData?.monto || '',
    fecha_salida: formatDateForInput(editData?.fecha_salida) || new Date().toISOString().split('T')[0],
    tipo_fianza: prefilledData?.tipo_fianza || editData?.tipo_fianza || 'fiel_cumplimiento',
    numero_fianza: prefilledData?.numero_fianza || editData?.numero_fianza || '',
    observada: !!editData?.observada,
    detalle_observacion: editData?.detalle_observacion || ''
  });
  
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tiposFianza = [
    { 
      id: 'fiel_cumplimiento', 
      label: 'Fiel Cumplimiento', 
      tag: 'Garantía de Contrato',
      icon: (
        <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      activeBorder: 'border-blue-600 bg-blue-50/80 shadow-md'
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
      activeBorder: 'border-purple-600 bg-purple-50/80 shadow-md'
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
      activeBorder: 'border-amber-600 bg-amber-50/80 shadow-md'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      if (editData) {
        setFormData({
          numero: editData.numero || '',
          monto: editData.monto || '',
          fecha_salida: formatDateForInput(editData.fecha_salida),
          tipo_fianza: editData.tipo_fianza || 'fiel_cumplimiento',
          numero_fianza: editData.numero_fianza || '',
          observada: !!editData.observada,
          detalle_observacion: editData.detalle_observacion || ''
        });
      } else if (prefilledData) {
        setFormData({
          numero: '',
          monto: '',
          fecha_salida: new Date().toISOString().split('T')[0],
          tipo_fianza: prefilledData.tipo_fianza || 'fiel_cumplimiento',
          numero_fianza: prefilledData.numero_fianza || '',
          observada: false,
          detalle_observacion: ''
        });
      } else {
        setFormData({
          numero: '',
          monto: '',
          fecha_salida: new Date().toISOString().split('T')[0],
          tipo_fianza: 'fiel_cumplimiento',
          numero_fianza: '',
          observada: false,
          detalle_observacion: ''
        });
      }
      setFile(null);
    }
  }, [isOpen, editData, prefilledData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const data = new FormData();
      Object.keys(formData).forEach(key => data.append(key, formData[key]));
      if (file) data.append('archivo', file);
      
      if (empresaId) data.append('empresa_id', empresaId);

      const url = editData ? `${API_BASE_URL}/api/facturas/${editData.id}` : `${API_BASE_URL}/api/facturas`;
      const method = editData ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        body: data,
      });

      if (response.ok) {
        toast.success(editData ? 'Factura actualizada exitosamente.' : 'Factura guardada exitosamente.');
        if (onSuccess) {
          onSuccess();
        } else {
          onClose();
        }
      } else {
        toast.error('Error al guardar.');
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
      <div className="relative w-full max-w-2xl bg-white border border-slate-200/80 rounded-[32px] shadow-2xl overflow-hidden flex flex-col text-slate-900 ring-1 ring-slate-200/60">
        
        <form onSubmit={handleSubmit} className="flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shadow-xs">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-wider">
                  {editData ? 'Actualizar Factura' : 'Registrar Nueva Factura'}
                </h3>
                {consorcioPreseleccionado && (
                  <div className="inline-flex items-center gap-1.5 mt-0.5 text-xs sm:text-sm text-blue-600 font-bold">
                    <span>{consorcioPreseleccionado}</span>
                  </div>
                )}
              </div>
            </div>

            <button 
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition-all shadow-xs"
            >
              ✕
            </button>
          </div>

          {/* Form Body */}
          <div className="p-6 space-y-5 overflow-y-auto max-h-[70vh] custom-scrollbar bg-white">
            
            {/* 1. Tipo Fianza */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Tipo de Fianza a Descontar
              </span>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tiposFianza.map(tipo => {
                  const isSelected = formData.tipo_fianza === tipo.id;
                  return (
                    <div
                      key={tipo.id}
                      onClick={() => setFormData({ ...formData, tipo_fianza: tipo.id })}
                      className={`p-4 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                        isSelected 
                          ? `${tipo.activeBorder} scale-[1.02]` 
                          : 'bg-slate-50/70 border-slate-200/80 hover:border-blue-400 hover:bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-xs">
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

            {/* 2. N° Factura & Monto */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  N° de Factura
                </label>
                <input 
                  type="text" 
                  value={formData.numero}
                  onChange={e => setFormData({...formData, numero: e.target.value})}
                  placeholder="F001-00123" 
                  required
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Monto / Valor Total (S/)
                </label>
                <input 
                  type="number" 
                  step="0.01"
                  value={formData.monto}
                  onChange={e => setFormData({...formData, monto: e.target.value})}
                  placeholder="0.00" 
                  required
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono font-black text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all"
                />
              </div>
            </div>

            {/* 3. Fechas & N° Fianza Relacionada */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Fecha de Salida / Emisión
                </label>
                <input 
                  type="date" 
                  value={formData.fecha_salida}
                  onChange={e => setFormData({...formData, fecha_salida: e.target.value})}
                  required
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-950 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  N° Fianza Relacionada
                </label>
                <input 
                  type="text" 
                  value={formData.numero_fianza}
                  onChange={e => setFormData({...formData, numero_fianza: e.target.value})}
                  placeholder="Ej: D0367002023-011" 
                  className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-mono font-bold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs"
                />
              </div>
            </div>

            {/* 4. Switch Factura Observada */}
            <div className="space-y-3">
              <div 
                onClick={() => setFormData({ ...formData, observada: !formData.observada })}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between cursor-pointer ${
                  formData.observada 
                    ? 'bg-rose-50 border-rose-200' 
                    : 'bg-slate-50/70 border-slate-200/80 hover:border-blue-400 hover:bg-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                    formData.observada ? 'bg-rose-600 text-white shadow-xs' : 'bg-white text-slate-500 border border-slate-200 shadow-xs'
                  }`}>
                    {formData.observada ? '⚠️' : '✓'}
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wider">
                      Factura Observada
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      Habilita la emisión de Nota de Crédito
                    </p>
                  </div>
                </div>

                <div className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 ${
                  formData.observada ? 'bg-rose-600 justify-end' : 'bg-slate-200 justify-start'
                }`}>
                  <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
                </div>
              </div>

              {formData.observada && (
                <div className="space-y-1.5 animate-fadeIn">
                  <label className="text-xs font-bold text-rose-700 uppercase tracking-wider">
                    Motivo / Detalle de la Observación
                  </label>
                  <textarea 
                    value={formData.detalle_observacion}
                    onChange={e => setFormData({...formData, detalle_observacion: e.target.value})}
                    className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-4 text-sm text-slate-950 placeholder-rose-400 focus:outline-none focus:border-rose-400 focus:ring-2 focus:ring-rose-100 min-h-[80px] resize-none shadow-xs font-medium"
                    placeholder="Describe el motivo por el cual fue observada..."
                  ></textarea>
                </div>
              )}
            </div>

            {/* 5. Carga de Documento */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Adjuntar Documento Digital (PDF o Imagen)
              </label>
              <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50 hover:bg-slate-100 hover:border-blue-400 transition-all">
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  onChange={e => setFile(e.target.files[0] || null)}
                  className="w-full text-xs sm:text-sm text-slate-700 font-medium file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-slate-950 file:text-white hover:file:bg-slate-900 cursor-pointer"
                />
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="p-5 border-t border-slate-100 bg-slate-50/50 flex justify-end items-center space-x-3">
            <button 
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSubmitting}
              className="bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-2.5 rounded-2xl transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? 'Guardando...' : (editData ? 'Actualizar Factura' : 'Guardar Factura')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevaFacturaModal;

