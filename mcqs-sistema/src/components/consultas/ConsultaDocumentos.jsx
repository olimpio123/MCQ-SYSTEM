import React, { useState } from 'react';
import { API_BASE_URL } from '../../config/api';
import toast from 'react-hot-toast';

const ConsultaDocumentos = () => {
  const [activeTab, setActiveTab] = useState('dni'); // 'dni' | 'ruc'
  const [documento, setDocumento] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultadoDni, setResultadoDni] = useState(null);
  const [resultadoRuc, setResultadoRuc] = useState(null);

  const handleConsultar = async (e) => {
    if (e) e.preventDefault();
    const doc = documento.trim();

    if (activeTab === 'dni') {
      if (!/^\d{8}$/.test(doc)) {
        toast.error('El DNI debe tener 8 dígitos numéricos');
        return;
      }
      setIsLoading(true);
      setResultadoDni(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/consultas/dni/${doc}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setResultadoDni(data.data);
          toast.success('DNI verificado con RENIEC');
        } else {
          toast.error(data.error || 'No se encontró información para el DNI');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error de conexión al consultar DNI');
      } finally {
        setIsLoading(false);
      }
    } else {
      if (!/^\d{11}$/.test(doc)) {
        toast.error('El RUC debe tener 11 dígitos numéricos');
        return;
      }
      setIsLoading(true);
      setResultadoRuc(null);
      try {
        const res = await fetch(`${API_BASE_URL}/api/consultas/ruc/${doc}`);
        const data = await res.json();
        if (res.ok && data.success) {
          setResultadoRuc(data.data);
          toast.success('RUC verificado con SUNAT');
        } else {
          toast.error(data.error || 'No se encontró información para el RUC');
        }
      } catch (err) {
        console.error(err);
        toast.error('Error de conexión al consultar RUC');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const copiarAlPortapapeles = (texto, label = 'Texto') => {
    if (!texto) return;
    navigator.clipboard.writeText(texto);
    toast.success(`${label} copiado`);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-12 font-sans select-none text-slate-800">
      {/* Header Unificado y Compacto */}
      <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 rounded-2xl p-5 shadow-sm ring-1 ring-slate-900/5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 tracking-tight">
                Consulta <span className="text-emerald-600">DNI & RUC</span>
              </h1>
              <p className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                RENIEC & SUNAT • PERUDEVS
              </p>
            </div>
          </div>

          {/* Selector de Pestaña Minimalista */}
          <div className="inline-flex p-1 rounded-xl bg-slate-100 border border-slate-200/60 self-start md:self-auto">
            <button
              onClick={() => {
                setActiveTab('dni');
                setDocumento('');
                setResultadoRuc(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeTab === 'dni'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'dni' ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
              <span>DNI (RENIEC)</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('ruc');
                setDocumento('');
                setResultadoDni(null);
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider transition-all ${
                activeTab === 'ruc'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${activeTab === 'ruc' ? 'bg-teal-500' : 'bg-slate-300'}`}></span>
              <span>RUC (SUNAT)</span>
            </button>
          </div>
        </div>

        {/* Input y Botón de Búsqueda Integrados */}
        <form onSubmit={handleConsultar} className="pt-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase bg-slate-100 px-1.5 py-0.5 rounded">
                  {activeTab === 'dni' ? 'DNI' : 'RUC'}
                </span>
              </div>
              <input
                type="text"
                maxLength={activeTab === 'dni' ? 8 : 11}
                value={documento}
                onChange={(e) => setDocumento(e.target.value.replace(/\D/g, ''))}
                placeholder={activeTab === 'dni' ? 'Ingresa 8 dígitos del DNI...' : 'Ingresa 11 dígitos del RUC...'}
                className="w-full bg-slate-50/70 border border-slate-200 rounded-xl pl-14 pr-9 py-2.5 text-sm font-bold font-mono tracking-wider text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:bg-white focus:ring-2 focus:ring-emerald-500/10 transition-all shadow-2xs"
                autoFocus
              />
              {documento && (
                <button
                  type="button"
                  onClick={() => setDocumento('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading || (activeTab === 'dni' ? documento.length !== 8 : documento.length !== 11)}
              className="bg-slate-900 hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed text-white text-[11px] font-bold uppercase tracking-wider px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-2 shrink-0 active:scale-98"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Buscando...</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span>Consultar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* RESULTADO DNI: Tarjeta Minimalista */}
      {activeTab === 'dni' && resultadoDni && (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm ring-1 ring-slate-900/5 space-y-5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200/80 flex items-center justify-center text-lg font-black shadow-2xs">
                {(resultadoDni.nombres || 'D')[0]}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                    {resultadoDni.nombre_completo || `${resultadoDni.nombres} ${resultadoDni.apellido_paterno} ${resultadoDni.apellido_materno}`}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    RENIEC
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500 font-bold">
                  DNI: <strong className="text-slate-900">{resultadoDni.id}</strong> • Dígito: <strong className="text-emerald-600">{resultadoDni.codigo_verificacion || '-'}</strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copiarAlPortapapeles(resultadoDni.nombre_completo, 'Nombre')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider transition-all"
              >
                Copiar Nombre
              </button>
              <button
                onClick={() => copiarAlPortapapeles(resultadoDni.id, 'DNI')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider transition-all"
              >
                Copiar DNI
              </button>
            </div>
          </div>

          {/* Grid de Datos DNI */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Nombres</span>
              <p className="text-xs font-bold text-slate-900 uppercase">{resultadoDni.nombres || '-'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Apellido Paterno</span>
              <p className="text-xs font-bold text-slate-900 uppercase">{resultadoDni.apellido_paterno || '-'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Apellido Materno</span>
              <p className="text-xs font-bold text-slate-900 uppercase">{resultadoDni.apellido_materno || '-'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Fecha Nacimiento</span>
              <p className="text-xs font-bold text-slate-900 font-mono">{resultadoDni.fecha_nacimiento || '-'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Género</span>
              <p className="text-xs font-bold text-slate-900">
                {resultadoDni.genero === 'M' ? 'Masculino (M)' : resultadoDni.genero === 'F' ? 'Femenino (F)' : resultadoDni.genero || '-'}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Dígito Verificador</span>
              <p className="text-xs font-bold text-emerald-600 font-mono">{resultadoDni.codigo_verificacion || '-'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Documento</span>
              <p className="text-xs font-bold text-slate-900 font-mono">{resultadoDni.id}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Condición</span>
              <p className="text-xs font-bold text-emerald-600 uppercase">Activo</p>
            </div>
          </div>
        </div>
      )}

      {/* RESULTADO RUC: Tarjeta Minimalista */}
      {activeTab === 'ruc' && resultadoRuc && (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-2xl p-6 shadow-sm ring-1 ring-slate-900/5 space-y-5 animate-in fade-in duration-200">
          {/* Header RUC */}
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 gap-3">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  resultadoRuc.estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                }`}>
                  ● {resultadoRuc.estado || 'ACTIVO'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${
                  resultadoRuc.condicion === 'HABIDO' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  ● {resultadoRuc.condicion || 'HABIDO'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 border border-slate-200">
                  {resultadoRuc.tipo || 'EMPRESA'}
                </span>
              </div>
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight leading-snug">
                {resultadoRuc.razon_social || resultadoRuc.nombre_comercial}
              </h2>
              {resultadoRuc.nombre_comercial && resultadoRuc.nombre_comercial !== '-' && (
                <p className="text-[11px] font-bold text-slate-500">
                  Comercial: <span className="text-slate-800 uppercase">{resultadoRuc.nombre_comercial}</span>
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copiarAlPortapapeles(resultadoRuc.razon_social, 'Razón Social')}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold uppercase tracking-wider transition-all"
              >
                Copiar Razón
              </button>
              <button
                onClick={() => copiarAlPortapapeles(resultadoRuc.id, 'RUC')}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold uppercase tracking-wider transition-all"
              >
                Copiar RUC
              </button>
            </div>
          </div>

          {/* Datos Rápidos RUC */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">RUC</span>
              <p className="text-xs font-bold font-mono text-slate-900">{resultadoRuc.id}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Inscripción</span>
              <p className="text-xs font-bold font-mono text-slate-900">{resultadoRuc.fecha_inscripcion || '-'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Emisión</span>
              <p className="text-xs font-bold text-slate-900 uppercase truncate">{resultadoRuc.sistema_emision || '-'}</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-0.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">Contabilidad</span>
              <p className="text-xs font-bold text-slate-900 uppercase truncate">{resultadoRuc.sistema_contabilidad || '-'}</p>
            </div>
          </div>

          {/* Domicilio Fiscal */}
          <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                Domicilio Fiscal
              </span>
              <button
                type="button"
                onClick={() => copiarAlPortapapeles(resultadoRuc.direccion, 'Dirección')}
                className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700"
              >
                Copiar Dirección
              </button>
            </div>
            <p className="text-xs font-bold text-slate-900 uppercase">
              {resultadoRuc.direccion || 'Sin dirección fiscal registrada'}
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                Dep: <strong className="text-slate-900">{resultadoRuc.departamento || '-'}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                Prov: <strong className="text-slate-900">{resultadoRuc.provincia || '-'}</strong>
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-[10px] font-bold text-slate-600">
                Dist: <strong className="text-slate-900">{resultadoRuc.distrito || '-'}</strong>
              </span>
            </div>
          </div>

          {/* Representantes Legales */}
          {resultadoRuc.representantes_legales && resultadoRuc.representantes_legales.length > 0 && (
            <div className="space-y-2.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
                Representantes Legales ({resultadoRuc.representantes_legales.length})
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {resultadoRuc.representantes_legales.map((rep, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/60 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {rep.cargo || 'REPRESENTANTE'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400">
                        {rep.desde || '-'}
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-slate-900 uppercase leading-snug truncate" title={rep.nombres}>
                      {rep.nombres}
                    </p>
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-0.5 border-t border-slate-200/50">
                      <span>{rep.tipo_documento}: {rep.numero_documento}</span>
                      <button
                        type="button"
                        onClick={() => copiarAlPortapapeles(rep.numero_documento, 'Doc')}
                        className="text-emerald-600 hover:text-emerald-700 font-bold"
                      >
                        Copiar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConsultaDocumentos;
