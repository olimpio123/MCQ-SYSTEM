import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config/api';

const Cargos = ({ onOpenCargo }) => {
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/cargos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const newCounts = {};
          (Array.isArray(data) ? data : []).forEach(item => {
            newCounts[item.tipo] = (newCounts[item.tipo] || 0) + 1;
          });
          setCounts(newCounts);
        }
      } catch (error) {
        console.error('Error fetching cargos counts:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCounts();
  }, []);

  const totalCargos = Object.values(counts).reduce((a, b) => a + b, 0);

  const cargoCards = [
    { 
      id: 'pagare', 
      num: '01',
      title: 'Cargo de Pagaré', 
      description: 'Control, registro y custodia de pagarés bancarios vinculados.',
      icon: (
        <svg className="w-6 h-6 text-sky-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ), 
      count: counts['pagare'] || 0,
      gradientBorder: 'from-sky-500 via-indigo-500 to-cyan-500',
      iconBg: 'bg-sky-50 text-sky-600 border-sky-200',
      badgeClass: 'bg-sky-100 text-sky-700 border-sky-200',
      tagColor: 'text-sky-700'
    },
    { 
      id: 'cheques', 
      num: '02',
      title: 'Cargo de Cheques', 
      description: 'Registro de emisión, entrega y recepción de cheques comerciales.',
      icon: (
        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ), 
      count: counts['cheques'] || 0,
      gradientBorder: 'from-emerald-500 via-teal-500 to-green-500',
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-200',
      badgeClass: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      tagColor: 'text-emerald-700'
    },
    { 
      id: 'liberacion', 
      num: '03',
      title: 'Solicitud de Liberación', 
      description: 'Trámite de liberación formal y devolución de cartas fianza.',
      icon: (
        <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
        </svg>
      ), 
      count: counts['liberacion'] || 0,
      gradientBorder: 'from-purple-500 via-fuchsia-500 to-indigo-500',
      iconBg: 'bg-purple-50 text-purple-600 border-purple-200',
      badgeClass: 'bg-purple-100 text-purple-700 border-purple-200',
      tagColor: 'text-purple-700'
    },
    { 
      id: 'devolucion_anulacion', 
      num: '04',
      title: 'Devolución / Anulación', 
      description: 'Actas de anulación, reintegros y devolución de garantías.',
      icon: (
        <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
      ), 
      count: counts['devolucion_anulacion'] || 0,
      gradientBorder: 'from-rose-500 via-pink-500 to-red-500',
      iconBg: 'bg-rose-50 text-rose-600 border-rose-200',
      badgeClass: 'bg-rose-100 text-rose-700 border-rose-200',
      tagColor: 'text-rose-700'
    },
    { 
      id: 'otros', 
      num: '05',
      title: 'Otros Cargos', 
      description: 'Comprobantes misceláneos, cargos internos y actas complementarias.',
      icon: (
        <svg className="w-6 h-6 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      ), 
      count: counts['otros'] || 0,
      gradientBorder: 'from-amber-500 via-yellow-500 to-orange-500',
      iconBg: 'bg-amber-50 text-amber-600 border-amber-200',
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
      tagColor: 'text-amber-800'
    },
  ];

  return (
    <div className="w-full space-y-4 pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-slate-900 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Custodia & Archivo</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
            Gestión de <span className="text-blue-600">Cargos y Documentos</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Administración centralizada de pagarés, cheques, actas y liberaciones
          </p>
        </div>

        {/* Mini Stats Banner */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200/80 p-1.5 rounded-xl shadow-xs">
          <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200/80 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Cargos</p>
              <p className="text-xs sm:text-sm font-black text-slate-950 font-mono">{totalCargos} <span className="text-[10px] text-slate-500 font-sans font-medium">docs</span></p>
            </div>
          </div>
          <div className="px-3 py-1.5 bg-white rounded-lg border border-slate-200/80 shadow-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Categorías</p>
              <p className="text-xs sm:text-sm font-black text-slate-950 font-mono">5 <span className="text-[10px] text-slate-500 font-sans font-medium">tipos</span></p>
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Cards Compactas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5">
        {cargoCards.map((cargo) => (
          <div 
            key={cargo.id}
            onClick={() => onOpenCargo(cargo)}
            className="group relative bg-white border border-slate-200/80 hover:border-blue-400 rounded-2xl p-4 shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between overflow-hidden text-slate-900"
          >
            {/* Barra superior */}
            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${cargo.gradientBorder} opacity-75 group-hover:opacity-100 transition-all duration-300`}></div>

            {/* Cabecera de la Tarjeta */}
            <div className="flex justify-between items-center mb-3 relative z-10">
              <span className={`text-[10px] font-mono font-bold ${cargo.tagColor} tracking-widest px-2 py-0.5 rounded-lg bg-slate-50 border border-slate-200`}>
                #{cargo.num}
              </span>
              <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider border ${cargo.badgeClass}`}>
                <span className="w-1 h-1 rounded-full bg-current animate-pulse"></span>
                <span>{cargo.count} Docs</span>
              </div>
            </div>

            {/* Icono */}
            <div className="flex flex-col items-center text-center my-1 relative z-10">
              <div className="relative mb-2.5">
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center transition-all duration-300 shadow-xs group-hover:scale-105 ${cargo.iconBg}`}>
                  {cargo.icon}
                </div>
              </div>

              {/* Título y Descripción */}
              <h3 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-wider mb-1 group-hover:text-blue-600 transition-colors">
                {cargo.title}
              </h3>
              <p className="text-[11px] font-medium text-slate-500 leading-tight min-h-[32px]">
                {cargo.description}
              </p>
            </div>

            {/* Botón de Acción Inferior */}
            <div className="pt-3 mt-2 border-t border-slate-100 relative z-10">
              <div className="w-full py-2 px-3 rounded-xl bg-slate-950 text-white text-xs font-bold uppercase tracking-wider flex items-center justify-between shadow-xs group-hover:bg-blue-600 transition-all duration-200">
                <span>Ver Archivos</span>
                <svg className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Cargos;

