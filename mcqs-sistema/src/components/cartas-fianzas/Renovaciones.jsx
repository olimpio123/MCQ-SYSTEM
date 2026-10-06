import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api';
import toast from 'react-hot-toast';

// ----------------------------------------------------
// COMPONENTE: Selector Desplegable con Búsqueda de Consorcio
// ----------------------------------------------------
const CustomConsorcioSearchSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value));
  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative w-full sm:w-80" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white/50 border border-white/60 rounded-xl pl-4 pr-10 py-2.5 text-xs font-bold text-slate-800 flex justify-between items-center transition-all hover:bg-white/80 hover:border-blue-400 uppercase tracking-wider text-left shadow-sm backdrop-blur-sm"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : '-- VINCULAR CONSORCIO --'}</span>
        <div className="absolute right-3 flex items-center pointer-events-none text-slate-500">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white/80 backdrop-blur-2xl border border-white/80 rounded-2xl shadow-2xl p-2.5 flex flex-col ring-1 ring-white/70">
          <div className="relative mb-2">
            <input
              type="text"
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar consorcio..."
              className="w-full bg-white/70 border border-white/80 rounded-xl pl-8 pr-3 py-2 text-xs font-bold text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-all uppercase shadow-inner"
            />
            <div className="absolute left-2.5 inset-y-0 flex items-center text-slate-400 pointer-events-none">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="overflow-y-auto max-h-52 custom-scrollbar flex flex-col space-y-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-all hover:bg-white/80 text-slate-900"
                >
                  {opt.label}
                </button>
              ))
            ) : (
              <div className="text-center py-3 text-xs text-slate-500 font-semibold uppercase">Sin resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// COMPONENTE: Selector Personalizado de Colores de Alerta
// ----------------------------------------------------
const CustomColorSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const colors = [
    { value: 'default', name: 'Gris', bg: 'bg-slate-400' },
    { value: 'verde', name: 'Verde', bg: 'bg-emerald-500' },
    { value: 'amarillo', name: 'Amarillo', bg: 'bg-amber-500' },
    { value: 'rojo', name: 'Rojo', bg: 'bg-rose-500' }
  ];

  const activeColor = colors.find(c => c.value === value) || colors[0];

  return (
    <div className="relative inline-block flex-shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-6 h-6 rounded-full border border-white flex items-center justify-center cursor-pointer shadow-sm transition-transform hover:scale-110 active:scale-95 ${activeColor.bg}`}
      >
        <span className="text-[8px] text-white">🎨</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 z-50 bg-white/95 backdrop-blur-3xl border border-white/90 rounded-xl shadow-2xl py-1.5 w-32 flex flex-col ring-1 ring-slate-900/5">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => {
                onChange(color.value);
                setIsOpen(false);
              }}
              className="flex items-center space-x-2.5 px-3 py-1.5 w-full text-left transition-colors hover:bg-slate-50"
            >
              <span className={`w-3 h-3 rounded-full ${color.bg}`}></span>
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">{color.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------
// COMPONENTE PRINCIPAL: Renovaciones
// ----------------------------------------------------
const Renovaciones = () => {
  const [empresas, setEmpresas] = useState([]);
  const [fianzasBD, setFianzasBD] = useState([]);
  const [rows, setRows] = useState([
    {
      id: 1,
      consorcio: 'CONSORCIO EJEMPLO ALFA',
      consorcioId: '',
      fianzasTipos: [
        { key: 'FC', label: 'Fiel Cumplimiento', montoInicial: '', penultima: '', ultima: '', renovada: false, observacion: '', colorObservacion: 'default' },
        { key: 'AD', label: 'Adelanto Directo', montoInicial: '', penultima: '', ultima: '', renovada: false, observacion: '', colorObservacion: 'default' },
        { key: 'AM', label: 'Adelanto Materiales', montoInicial: '', penultima: '', ultima: '', renovada: false, observacion: '', colorObservacion: 'default' }
      ],
      activeDropdownFianzaIndex: null
    }
  ]);

  const [selectedConsorcioParaAgregar, setSelectedConsorcioParaAgregar] = useState('');

  useEffect(() => {
    const fetchDBData = async () => {
      try {
        const resEmp = await fetch(`${API_BASE_URL}/api/empresas`);
        const resFianzas = await fetch(`${API_BASE_URL}/api/fianzas`);
        if (resEmp.ok && resFianzas.ok) {
          const dataEmp = await resEmp.json();
          const dataFianzas = await resFianzas.json();
          setEmpresas(dataEmp);
          setFianzasBD(dataFianzas);
        }
      } catch (err) {
        console.error('Error fetching data for vinculación:', err);
      }
    };
    fetchDBData();
  }, []);

  const handleAddManualRow = () => {
    const newRow = {
      id: Date.now(),
      consorcio: '',
      consorcioId: '',
      fianzasTipos: [
        { key: 'FC', label: 'Fiel Cumplimiento', montoInicial: '', penultima: '', ultima: '', renovada: false, observacion: '', colorObservacion: 'default' },
        { key: 'AD', label: 'Adelanto Directo', montoInicial: '', penultima: '', ultima: '', renovada: false, observacion: '', colorObservacion: 'default' },
        { key: 'AM', label: 'Adelanto Materiales', montoInicial: '', penultima: '', ultima: '', renovada: false, observacion: '', colorObservacion: 'default' }
      ],
      activeDropdownFianzaIndex: null
    };
    setRows([...rows, newRow]);
    toast.success('Nueva fila añadida.');
  };

  const handleDeleteRow = (id) => {
    setRows(rows.filter(row => row.id !== id));
  };

  const handleInputChange = (id, field, value) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleFianzaTypeChange = (rowId, index, field, value) => {
    setRows(rows.map(row => {
      if (row.id === rowId) {
        const updatedFianzas = [...row.fianzasTipos];
        updatedFianzas[index] = {
          ...updatedFianzas[index],
          [field]: value
        };

        if (field === 'observacion') {
          const text = value.toLowerCase();
          if (text.includes('vencid') || text.includes('critic') || text.includes('alert') || text.includes('urgente')) {
            updatedFianzas[index].colorObservacion = 'rojo';
          } else if (text.includes('tramit') || text.includes('proces') || text.includes('pendient')) {
            updatedFianzas[index].colorObservacion = 'amarillo';
          } else if (text.includes('ok') || text.includes('conforme') || text.includes('al dia') || text.includes('liberad')) {
            updatedFianzas[index].colorObservacion = 'verde';
          } else {
            updatedFianzas[index].colorObservacion = 'default';
          }
        }

        return { ...row, fianzasTipos: updatedFianzas };
      }
      return row;
    }));
  };

  const getFianzasVinculadasPorTipo = (consorcioId, consorcioNombre, tipoKey) => {
    if (!consorcioId && !consorcioNombre) return [];
    
    let dbTipo = 'fiel_cumplimiento';
    if (tipoKey === 'AD') dbTipo = 'adelanto_directo';
    if (tipoKey === 'AM') dbTipo = 'adelanto_materiales';

    return fianzasBD.filter(f => 
      (String(f.empresa_id) === String(consorcioId) || 
      (f.consorcio && f.consorcio.toLowerCase() === consorcioNombre.toLowerCase()) || 
      (f.empresa && f.empresa.toLowerCase() === consorcioNombre.toLowerCase())) &&
      f.tipo === dbTipo
    );
  };

  const handleVincularConsorcioHeader = (consorcioId) => {
    if (!consorcioId) return;
    
    const existe = rows.some(r => String(r.consorcioId) === String(consorcioId));
    if (existe) {
      toast.error('Este consorcio ya se encuentra en el cuadro de control.');
      return;
    }

    const selectedEmp = empresas.find(e => String(e.id) === String(consorcioId));
    if (!selectedEmp) return;

    const fianzas = fianzasBD.filter(f => 
      String(f.empresa_id) === String(consorcioId) || 
      (f.consorcio && f.consorcio.toLowerCase() === selectedEmp.nombre.toLowerCase()) || 
      (f.empresa && f.empresa.toLowerCase() === selectedEmp.nombre.toLowerCase())
    );

    const fianzasPorTipo = { FC: [], AD: [], AM: [] };
    fianzas.forEach(f => {
      let key = 'FC';
      if (f.tipo === 'adelanto_directo') key = 'AD';
      if (f.tipo === 'adelanto_materiales') key = 'AM';
      fianzasPorTipo[key].push(f);
    });

    const listaFianzasFinal = [];
    const fianzaKeys = ['FC', 'AD', 'AM'];
    fianzaKeys.forEach(tipoKey => {
      const dbFianzasTipo = fianzasPorTipo[tipoKey];
      if (dbFianzasTipo.length === 0) {
        listaFianzasFinal.push({
          key: tipoKey,
          label: tipoKey === 'FC' ? 'Fiel Cumplimiento' : tipoKey === 'AD' ? 'Adelanto Directo' : 'Adelanto Materiales',
          montoInicial: '',
          penultima: '',
          ultima: '',
          renovada: false,
          observacion: '',
          colorObservacion: 'default'
        });
        return;
      }

      const fianzasTerminadasEn000 = dbFianzasTipo.filter(f => f.numero && f.numero.endsWith('000'));
      
      if (fianzasTerminadasEn000.length > 1) {
        const ordenadasPorFecha = [...fianzasTerminadasEn000].sort((a, b) => new Date(a.fecha_creacion || a.fecha_vencimiento) - new Date(b.fecha_creacion || b.fecha_vencimiento));
        const fianzaInicialReal = ordenadasPorFecha[0];
        const adicionales = ordenadasPorFecha.slice(1);

        const descientesFianzaInicial = dbFianzasTipo.filter(f => !adicionales.some(a => a.id === f.id));
        const sortedDescendientes = [...descientesFianzaInicial].sort((a, b) => new Date(b.fecha_vencimiento) - new Date(a.fecha_vencimiento));

        const ultimaCF = sortedDescendientes[0];
        const penultimaCF = sortedDescendientes[1] || null;

        listaFianzasFinal.push({
          key: tipoKey,
          label: tipoKey === 'FC' ? 'Fiel Cumplimiento' : tipoKey === 'AD' ? 'Adelanto Directo' : 'Adelanto Materiales',
          montoInicial: `${ultimaCF.moneda === 'USD' ? '$' : 'S/'} ${parseFloat(ultimaCF.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
          penultima: penultimaCF ? `${penultimaCF.moneda === 'USD' ? '$' : 'S/'} ${parseFloat(penultimaCF.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '',
          ultima: `${ultimaCF.moneda === 'USD' ? '$' : 'S/'} ${parseFloat(ultimaCF.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
          renovada: false,
          observacion: ultimaCF.observacion || '',
          colorObservacion: 'default'
        });

        adicionales.forEach((fAdic, idx) => {
          listaFianzasFinal.push({
            key: tipoKey,
            label: `${tipoKey === 'FC' ? 'Fiel Cumplimiento' : tipoKey === 'AD' ? 'Adelanto Directo' : 'Adelanto Materiales'} (Adicional ${idx + 1})`,
            montoInicial: `${fAdic.moneda === 'USD' ? '$' : 'S/'} ${parseFloat(fAdic.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
            penultima: '',
            ultima: `${fAdic.moneda === 'USD' ? '$' : 'S/'} ${parseFloat(fAdic.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}`,
            renovada: false,
            observacion: fAdic.observacion || 'ADICIONAL DE FIANZA',
            colorObservacion: 'default',
            isAdicional: true,
            referenciaFianzaId: fAdic.id
          });
        });

      } else {
        const listaFianzas = dbFianzasTipo.sort((a, b) => new Date(b.fecha_vencimiento) - new Date(a.fecha_vencimiento));
        const ultimaCF = listaFianzas[0];
        const penultimaCF = listaFianzas[1] || null;

        listaFianzasFinal.push({
          key: tipoKey,
          label: tipoKey === 'FC' ? 'Fiel Cumplimiento' : tipoKey === 'AD' ? 'Adelanto Directo' : 'Adelanto Materiales',
          montoInicial: `${ultimaCF.monto ? (ultimaCF.moneda === 'USD' ? '$' : 'S/') + ' ' + parseFloat(ultimaCF.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : ''}`,
          penultima: penultimaCF ? `${penultimaCF.moneda === 'USD' ? '$' : 'S/'} ${parseFloat(penultimaCF.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}` : '',
          ultima: `${ultimaCF.monto ? (ultimaCF.moneda === 'USD' ? '$' : 'S/') + ' ' + parseFloat(ultimaCF.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 }) : ''}`,
          renovada: false,
          observacion: ultimaCF.observacion || '',
          colorObservacion: 'default'
        });
      }
    });

    const newRow = {
      id: Date.now(),
      consorcioId: consorcioId,
      consorcio: selectedEmp.nombre,
      fianzasTipos: listaFianzasFinal,
      activeDropdownFianzaIndex: null
    };

    setRows([...rows, newRow]);
    toast.success(`Consorcio '${selectedEmp.nombre.toUpperCase()}' vinculado con éxito.`);
  };

  const getCellBgColor = (color) => {
    if (color === 'verde') return 'bg-emerald-50 border border-emerald-200/90 text-emerald-800';
    if (color === 'amarillo') return 'bg-amber-50 border border-amber-200/90 text-amber-800';
    if (color === 'rojo') return 'bg-rose-50 border border-rose-200/90 text-rose-800';
    return 'bg-slate-50/80 border border-slate-200/80 text-slate-800';
  };

  return (
    <div className="w-full space-y-8 pb-16 font-sans select-none text-slate-900">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-6 sm:p-8 shadow-[0_15px_35px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/60 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight uppercase">
            Gestión de Renovaciones
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">
            Cuadro de Vencimientos Comparativo por Consorcio
          </p>
        </div>

        {/* Controles de agregar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
          <CustomConsorcioSearchSelect 
            value={selectedConsorcioParaAgregar}
            onChange={(val) => {
              setSelectedConsorcioParaAgregar(val);
              handleVincularConsorcioHeader(val);
            }}
            options={empresas.map(e => ({ value: e.id, label: e.nombre }))}
          />

          <button 
            onClick={handleAddManualRow}
            className="bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-black uppercase tracking-wider px-5 py-3 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 border border-slate-800"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            <span>Crear Manual</span>
          </button>
        </div>
      </div>

      {/* Cuadros agrupados por Consorcio */}
      <div className="space-y-7">
        {rows.map((row, rowIndex) => (
          <div 
            key={row.id}
            className="bg-white/90 backdrop-blur-xl border border-white rounded-[32px] p-7 shadow-[0_15px_35px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/60 relative overflow-hidden"
          >
            {/* Header del Consorcio */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-5 gap-3">
              <div className="relative group/consorcio flex items-center w-full max-w-xl">
                <input 
                  type="text"
                  value={row.consorcio}
                  onChange={(e) => handleInputChange(row.id, 'consorcio', e.target.value)}
                  placeholder="Nombre del Consorcio..."
                  className="w-full bg-transparent border-0 focus:ring-0 px-2 py-1 text-lg sm:text-xl font-black text-blue-600 uppercase tracking-wide"
                />

                <button
                  onClick={() => handleDeleteRow(row.id)}
                  className="p-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all ml-2 border border-rose-200 shadow-xs"
                  title="Eliminar Consorcio"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>

              <span className="text-xs font-mono text-slate-400 uppercase tracking-widest flex-shrink-0 font-black">
                Cuadro N° {rowIndex + 1}
              </span>
            </div>

            {/* Sub-Tabla */}
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1100px]">
                <thead>
                  <tr className="text-xs font-black text-slate-500 uppercase tracking-wider border-b border-slate-200 pb-3.5">
                    <th className="pb-3.5 w-[260px]">Tipo Fianza</th>
                    <th className="pb-3.5 text-center w-[160px]">Monto Inicial</th>
                    <th className="pb-3.5 text-center w-[160px]">Penúltima Salida</th>
                    <th className="pb-3.5 text-center w-[160px] text-blue-600">Última Salida</th>
                    <th className="pb-3.5 text-center w-[130px]">¿Se Renovó?</th>
                    <th className="pb-3.5 pl-4">Observaciones</th>
                    <th className="pb-3.5 text-center w-[60px]">Limpiar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {row.fianzasTipos.map((fData, index) => {
                    const fKey = fData.key;
                    const isDropdownOpen = row.activeDropdownFianzaIndex === index;
                    
                    let fianzasBDTipo = getFianzasVinculadasPorTipo(row.consorcioId, row.consorcio, fKey);
                    if (fData.isAdicional && fData.referenciaFianzaId) {
                      fianzasBDTipo = fianzasBDTipo.filter(f => f.id === fData.referenciaFianzaId);
                    }

                    return (
                      <tr key={index} className="hover:bg-slate-50/80 transition-colors align-middle">
                        <td className="py-4 font-black">
                          <div className="flex items-center space-x-2.5 relative">
                            <span className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-black tracking-wider bg-slate-100 border border-slate-200 text-slate-900 shadow-xs">
                              {fData.label}
                            </span>

                            {fianzasBDTipo.length > 0 && (
                              <div className="inline-block">
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleInputChange(row.id, 'activeDropdownFianzaIndex', isDropdownOpen ? null : index);
                                  }}
                                  className="p-1.5 rounded-xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-700 transition-all text-xs border border-blue-400/40 shadow-sm"
                                  title={`Ver cartas en BD (${fianzasBDTipo.length})`}
                                >
                                  👁️
                                </button>

                                {isDropdownOpen && (
                                  <div className="absolute left-0 mt-2 z-40 bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 w-80 max-h-72 overflow-y-auto custom-scrollbar flex flex-col space-y-2 ring-1 ring-slate-200/60 animate-fadeIn">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-wider text-left border-b border-slate-100 pb-1.5">
                                      Historial {fKey} en BD ({fianzasBDTipo.length})
                                    </p>
                                    {fianzasBDTipo.map((f, idxFianza) => (
                                      <div key={idxFianza} className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs font-bold shadow-xs">
                                        <div className="flex flex-col text-left">
                                          <span className="text-slate-950 font-mono font-black">N° {f.numero}</span>
                                          <span className="text-[10px] text-slate-500 font-bold">VENCE: {f.fecha_vencimiento ? new Date(f.fecha_vencimiento).toLocaleDateString() : '---'}</span>
                                        </div>
                                        <span className="text-blue-600 font-mono text-xs font-black">
                                          {f.moneda === 'USD' ? '$' : 'S/'} {parseFloat(f.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                        </span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Monto Inicial */}
                        <td className="py-4 text-center">
                          <input 
                            type="text"
                            value={fData.montoInicial}
                            onChange={(e) => handleFianzaTypeChange(row.id, index, 'montoInicial', e.target.value)}
                            placeholder="S/ 0.00"
                            className="w-full bg-transparent text-center border-0 focus:ring-0 text-sm font-black text-slate-950 font-mono"
                          />
                        </td>

                        {/* Penúltima */}
                        <td className="py-4 text-center">
                          <input 
                            type="text"
                            value={fData.penultima}
                            onChange={(e) => handleFianzaTypeChange(row.id, index, 'penultima', e.target.value)}
                            placeholder="S/ 0.00"
                            className="w-full bg-transparent text-center border-0 focus:ring-0 text-sm font-black text-slate-800 font-mono"
                          />
                        </td>

                        {/* Última */}
                        <td className="py-4 text-center">
                          <input 
                            type="text"
                            value={fData.ultima}
                            onChange={(e) => handleFianzaTypeChange(row.id, index, 'ultima', e.target.value)}
                            placeholder="S/ 0.00"
                            className="w-full bg-transparent text-center border-0 focus:ring-0 text-sm font-black text-blue-700 font-mono"
                          />
                        </td>

                        {/* Renovada */}
                        <td className="py-4 text-center">
                          <label className="relative inline-flex items-center cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={fData.renovada}
                              onChange={(e) => handleFianzaTypeChange(row.id, index, 'renovada', e.target.checked)}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            <span className={`ml-2 text-xs font-black uppercase min-w-[20px] ${fData.renovada ? 'text-emerald-700' : 'text-slate-600'}`}>
                              {fData.renovada ? 'SÍ' : 'NO'}
                            </span>
                          </label>
                        </td>

                        {/* Observaciones */}
                        <td className="py-3 pl-4 pr-2">
                          <div className={`flex items-center space-x-2.5 p-2.5 rounded-2xl transition-all ${getCellBgColor(fData.colorObservacion)}`}>
                            <CustomColorSelect 
                              value={fData.colorObservacion}
                              onChange={(val) => handleFianzaTypeChange(row.id, index, 'colorObservacion', val)}
                            />
                            <input 
                              type="text"
                              value={fData.observacion}
                              onChange={(e) => handleFianzaTypeChange(row.id, index, 'observacion', e.target.value)}
                              placeholder="Observación..."
                              className="w-full bg-transparent border-0 focus:ring-0 text-xs sm:text-sm font-black uppercase placeholder-slate-400 text-slate-950"
                            />
                          </div>
                        </td>

                        {/* Limpiar */}
                        <td className="py-4 text-center">
                          <button
                            onClick={() => {
                              handleFianzaTypeChange(row.id, index, 'montoInicial', '');
                              handleFianzaTypeChange(row.id, index, 'penultima', '');
                              handleFianzaTypeChange(row.id, index, 'ultima', '');
                              handleFianzaTypeChange(row.id, index, 'observacion', '');
                              handleFianzaTypeChange(row.id, index, 'colorObservacion', 'default');
                              handleFianzaTypeChange(row.id, index, 'renovada', false);
                              toast.success(`Fianza ${fKey} restablecida.`);
                            }}
                            className="w-8 h-8 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-950 transition-all flex items-center justify-center mx-auto text-sm shadow-xs font-bold cursor-pointer"
                            title="Limpiar"
                          >
                            ⟲
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Renovaciones;

