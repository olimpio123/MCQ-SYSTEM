import React, { useState } from 'react';
import { API_BASE_URL } from '../../config/api';

const TramitesHuanuco = () => {
  const [expedienteId, setExpedienteId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const [selectedDoc, setSelectedDoc] = useState(null);
  const [loadingMovimientos, setLoadingMovimientos] = useState(false);
  const [movimientosList, setMovimientosList] = useState([]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!expedienteId.trim()) return;
    
    setLoading(true);
    setResult(null);
    setSelectedDoc(null);
    setMovimientosList([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tramites/gorehco/${encodeURIComponent(expedienteId)}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.listado) && data.listado.length > 0) {
          setResult({
            hasData: true,
            listado: data.listado,
            webUrl: data.webUrl
          });
        } else {
          setResult({
            hasData: false,
            message: 'No se encontraron registros para este código de expediente en el portal regional.'
          });
        }
      } else {
        setResult({
          hasData: false,
          message: 'Error al consultar el servidor. Inténtalo de nuevo más tarde.'
        });
      }
    } catch (error) {
      console.error(error);
      setResult({
        hasData: false,
        message: 'Error de red al conectar con el servidor local.'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFetchMovimientos = async (doc) => {
    if (selectedDoc && selectedDoc.iddocumento === doc.iddocumento) {
      setSelectedDoc(null);
      setMovimientosList([]);
      return;
    }

    setSelectedDoc(doc);
    setLoadingMovimientos(true);
    setMovimientosList([]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/tramites/gorehco/documento/${doc.iddocumento}`);
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.detalle && Array.isArray(data.detalle.operaciones)) {
          setMovimientosList(data.detalle.operaciones);
        } else {
          setMovimientosList([]);
        }
      }
    } catch (error) {
      console.error('Error cargando movimientos:', error);
    } finally {
      setLoadingMovimientos(false);
    }
  };

  const formatFecha = (d) => {
    if (!d) return 'N/A';
    try {
      return new Date(d).toLocaleDateString('es-PE');
    } catch (e) {
      return d;
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 text-slate-900">
      {/* Header White Luxury Card */}
      <div className="bg-white/90 backdrop-blur-xl border border-white shadow-[0_15px_35px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/60 rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 text-slate-900 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-20">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 border border-blue-200 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-black uppercase tracking-wider text-blue-700">Mesa de Partes Virtual</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
            Seguimiento de <span className="text-blue-600">Trámites (Huánuco)</span>
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Mesa de Partes Virtual - Gobierno Regional de Huánuco</p>
        </div>
      </div>

      {/* Formulario de Búsqueda White Luxury Card */}
      <div className="bg-white/90 backdrop-blur-xl border border-white shadow-[0_15px_35px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/60 rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 text-slate-900 relative overflow-hidden">
        <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <label className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-wider whitespace-nowrap flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-pulse"></span>
              N° de Expediente:
            </label>
            <input
              type="text"
              value={expedienteId}
              onChange={(e) => setExpedienteId(e.target.value)}
              placeholder="Ingresa código de expediente (Ej: 04289469)..."
              className="flex-1 w-full bg-white border border-slate-200 rounded-2xl px-4 py-3.5 text-sm font-bold text-slate-950 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 shadow-xs transition-all uppercase tracking-wider"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-white text-xs sm:text-sm font-black tracking-wider uppercase px-8 py-3.5 transition-all shadow-md active:scale-95 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Buscando...</span>
                </div>
              ) : (
                <>
                  <span>Consultar</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Resultados de Búsqueda White Luxury Card */}
      <div className="w-full bg-white/90 backdrop-blur-xl border border-white shadow-[0_15px_35px_rgba(0,0,0,0.04)] ring-1 ring-slate-200/60 rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 text-slate-900 relative min-h-[320px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-20">
            <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-sm font-black text-slate-700 uppercase tracking-wider animate-pulse">Consultando base de datos del GOREHCO...</p>
          </div>
        ) : result ? (
          result.hasData ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Encabezado */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-3.5 w-3.5 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                  </div>
                  <div>
                    <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-black tracking-wider uppercase rounded-full shadow-xs">
                      Expediente Encontrado
                    </span>
                    <h2 className="text-lg sm:text-xl font-black text-slate-950 uppercase tracking-wider mt-1 font-mono">
                      Expediente N° <span className="text-blue-600">{expedienteId}</span>
                    </h2>
                  </div>
                </div>
                {result.webUrl && (
                  <a 
                    href={result.webUrl} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-xs sm:text-sm font-black text-slate-800 hover:text-slate-950 uppercase tracking-wider bg-white hover:bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-200 shadow-xs transition-all flex items-center gap-2 group"
                  >
                    <span>Portal Web Oficial</span>
                    <svg className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>

              {/* Listado de Documentos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-2.5 h-5 bg-blue-600 rounded-full"></div>
                    <h3 className="text-sm font-black text-slate-950 uppercase tracking-wider">
                      Registros del expediente:
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-blue-600 tracking-wider">
                    💡 Haz clic en el Registro para desplegar su historial
                  </span>
                </div>

                <div className="overflow-x-auto custom-scrollbar border border-slate-200/80 rounded-2xl overflow-hidden bg-white shadow-xs">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                        <th className="p-4">Registro</th>
                        <th className="p-4">Fecha</th>
                        <th className="p-4">Documento</th>
                        <th className="p-4 w-[350px]">Asunto</th>
                        <th className="p-4">Firma</th>
                        <th className="p-4">Unidad Org.</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-950 font-bold uppercase tracking-wider text-sm">
                      {result.listado.map((doc, idx) => {
                        const isDocSelected = selectedDoc && selectedDoc.iddocumento === doc.iddocumento;
                        return (
                          <React.Fragment key={idx}>
                            <tr 
                              onClick={() => handleFetchMovimientos(doc)}
                              className={`transition-all duration-200 cursor-pointer ${
                                isDocSelected 
                                  ? 'bg-blue-50/80 border-l-4 border-l-blue-600' 
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="p-4 font-mono font-black">
                                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all ${
                                  isDocSelected 
                                    ? 'bg-blue-600 text-white border-blue-600 font-black shadow-xs' 
                                    : 'bg-slate-50 text-blue-700 border-slate-200 font-black shadow-xs'
                                }`}>
                                  <span>👁️</span>
                                  <span>{doc.iddocumento}</span>
                                </span>
                              </td>
                              <td className="p-4 font-mono whitespace-nowrap text-slate-600 font-bold">{formatFecha(doc.docu_fecha_doc)}</td>
                              <td className="p-4 font-black text-slate-950">{doc.tdoc_descripcion} {doc.docu_numero_doc || ''} - {doc.docu_siglas_doc || ''}</td>
                              <td className="p-4 text-xs sm:text-sm font-semibold max-w-[350px] leading-relaxed break-words text-slate-700">{doc.docu_asunto}</td>
                              <td className="p-4 whitespace-nowrap text-slate-600 font-bold">{doc.docu_firma || '-'}</td>
                              <td className="p-4 text-slate-700 font-bold">{doc.depe_nombre}</td>
                            </tr>

                            {isDocSelected && (
                              <tr>
                                <td colSpan="6" className="p-4 bg-slate-50/50 border-y border-slate-200">
                                  <div className="space-y-3 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs animate-fadeIn">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                                      <div className="flex items-center space-x-2.5">
                                        <h4 className="text-sm font-black text-slate-950 uppercase tracking-wider">
                                          Historial de Movimientos • <span className="text-blue-600 font-mono">Registro {doc.iddocumento}</span>
                                        </h4>
                                      </div>
                                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                        {doc.tdoc_descripcion} {doc.docu_numero_doc}
                                      </span>
                                    </div>

                                    {loadingMovimientos ? (
                                      <div className="flex items-center space-x-3 py-6 justify-center">
                                        <div className="w-5 h-5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
                                        <span className="text-xs font-black text-slate-700 uppercase tracking-wider animate-pulse">Cargando movimientos...</span>
                                      </div>
                                    ) : movimientosList.length > 0 ? (
                                      <div className="overflow-x-auto border border-slate-200/80 rounded-xl bg-white overflow-hidden shadow-xs">
                                        <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                          <thead>
                                            <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-xs border-b border-slate-200">
                                              <th className="p-3.5">FECHA Y HORA</th>
                                              <th className="p-3.5">ORIGEN / UNIDAD</th>
                                              <th className="p-3.5 text-center">OPERACIÓN</th>
                                              <th className="p-3.5">PROCESADO POR</th>
                                              <th className="p-3.5">OBSERVACIONES</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 text-slate-950 uppercase tracking-wider text-xs sm:text-sm font-bold">
                                            {movimientosList.map((op, opIdx) => {
                                              const actionTypes = {
                                                1: 'REGISTRADO',
                                                2: 'DERIVADO',
                                                3: 'ARCHIVADO',
                                                4: 'OBSERVADO'
                                              };
                                              return (
                                                <tr key={opIdx} className="hover:bg-slate-50/80 transition-colors">
                                                  <td className="p-3.5 font-mono whitespace-nowrap text-slate-950 font-black">
                                                    {formatFecha(op.created_at)} - {op.fecha_procesado ? op.fecha_procesado.split(' ')[1] : ''}
                                                  </td>
                                                  <td className="p-3.5 text-slate-950 font-black">{op.unidad || op.dependencia}</td>
                                                  <td className="p-3.5 text-center">
                                                    <span className={`inline-block px-3 py-1 rounded-xl text-xs font-black border tracking-wider uppercase shadow-xs ${
                                                      op.oper_idtope === 1 
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                                      op.oper_idtope === 2 
                                                        ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                      op.oper_idtope === 3
                                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                          'bg-rose-50 text-rose-700 border-rose-200'
                                                    }`}>
                                                      {actionTypes[op.oper_idtope] || 'PROCESADO'}
                                                    </span>
                                                  </td>
                                                  <td className="p-3.5 whitespace-nowrap text-slate-950 font-black">{op.nombre} {op.apellido}</td>
                                                  <td className="p-3.5 text-slate-600 font-medium">{op.oper_observacion || '-'}</td>
                                                </tr>
                                              );
                                            })}
                                          </tbody>
                                        </table>
                                      </div>
                                    ) : (
                                      <div className="text-center py-6 text-xs sm:text-sm font-black text-slate-500 uppercase tracking-widest">
                                        No se registran operaciones para este documento.
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center py-12 space-y-3">
              <span className="text-4xl">⚠️</span>
              <p className="text-sm font-black text-slate-950 uppercase tracking-wide max-w-md">{result.message}</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center text-center py-16 space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center border border-slate-200 shadow-xs">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-950 uppercase tracking-wider">Seguimiento de Expediente</h3>
              <p className="text-sm text-slate-500 font-bold max-w-sm">
                Ingresa el código del expediente arriba para consultar su estado, registros e historial de movimientos en tiempo real.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TramitesHuanuco;
