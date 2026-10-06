import React, { useState, useEffect, useMemo } from 'react';
import { API_BASE_URL } from '../../config/api';
import ReactApexChart from 'react-apexcharts';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  Cell, LabelList
} from 'recharts';
import toast from 'react-hot-toast';
import { 
  LayoutDashboard, Activity, RefreshCw, Layers, ShieldCheck, 
  Clock, AlertTriangle, ArrowUpRight, Copy, Building2, ChevronRight, CalendarDays 
} from 'lucide-react';

const Dashboard = ({ onNavigate, onOpenEmpresaFianza }) => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchMetrics = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/metrics?_t=` + new Date().getTime());
      if (!response.ok) throw new Error('Error al consultar métricas');
      const data = await response.json();
      setMetrics(data);
      if (isManual) {
        toast.success('Métricas actualizadas correctamente', { id: 'dash-refresh' });
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('No se pudieron cargar las métricas', { id: 'dash-error' });
    } finally {
      setLoading(false);
      if (isManual) setTimeout(() => setRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, []);

  const formatCurrency = (value, moneda = 'PEN') => {
    const symbol = moneda === 'USD' ? '$' : 'S/';
    return `${symbol} ${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`;
  };

  const formatMes = (mesStr) => {
    if (!mesStr) return '';
    const [year, month] = mesStr.split('-');
    const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Set', 'Oct', 'Nov', 'Dic'];
    const monthIdx = parseInt(month, 10) - 1;
    const mesNombre = meses[monthIdx] || month;
    const yearShort = year ? `'${year.slice(2)}` : '';
    return `${mesNombre} ${yearShort}`;
  };

  const copyToClipboard = (text, label) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label || 'Código'} copiado: ${text}`, {
      icon: '📋',
      duration: 2500
    });
  };

  const getTipoInfo = (tipoKey) => {
    switch (tipoKey) {
      case 'fiel_cumplimiento':
        return {
          label: 'Fiel Cumplimiento',
          shortLabel: 'Fiel Cumplimiento',
          badge: 'bg-emerald-50 text-emerald-700 border-emerald-200/90',
          dot: 'bg-emerald-500',
          color: '#10b981'
        };
      case 'adelanto_directo':
        return {
          label: 'Adelanto Directo',
          shortLabel: 'Adelanto Directo',
          badge: 'bg-blue-50 text-blue-700 border-blue-200/90',
          dot: 'bg-blue-500',
          color: '#3b82f6'
        };
      case 'adelanto_materiales':
        return {
          label: 'Adelanto de Materiales',
          shortLabel: 'Adelanto Materiales',
          badge: 'bg-amber-50 text-amber-700 border-amber-200/90',
          dot: 'bg-amber-500',
          color: '#f59e0b'
        };
      default:
        return {
          label: (tipoKey || 'Fianza').replace('_', ' '),
          shortLabel: (tipoKey || 'Fianza').replace('_', ' '),
          badge: 'bg-slate-50 text-slate-700 border-slate-200',
          dot: 'bg-slate-500',
          color: '#64748b'
        };
    }
  };

  // Calculate Tipo Data for Pie & Detail cards (purely count-focused)
  const tiposRaw = metrics?.charts?.fianzasTipo || [];
  const totalCartasTipo = tiposRaw.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0) || 1;

  const tiposFormatted = useMemo(() => {
    return [
      { key: 'fiel_cumplimiento', defaultName: 'Fiel Cumplimiento' },
      { key: 'adelanto_directo', defaultName: 'Adelanto Directo' },
      { key: 'adelanto_materiales', defaultName: 'Adelanto de Materiales' }
    ].map(def => {
      const found = tiposRaw.find(t => t.name === def.key);
      const value = found ? Number(found.value) : 0;
      const percentage = ((value / totalCartasTipo) * 100).toFixed(1);
      const info = getTipoInfo(def.key);
      return {
        key: def.key,
        name: info.label,
        shortLabel: info.shortLabel,
        value: value,
        percentage: percentage,
        color: info.color,
        badge: info.badge,
        dot: info.dot
      };
    });
  }, [tiposRaw, totalCartasTipo]);

  // ApexChart monochrome pastel pie options (matching user requested style)
  const apexOptions = useMemo(() => ({
    chart: {
      type: 'pie',
      toolbar: { show: false },
      fontFamily: 'inherit'
    },
    labels: tiposFormatted.map(t => t.shortLabel),
    theme: {
      monochrome: {
        enabled: true,
        color: '#0284c7', // Vibrant Cerulean Blue
        shadeTo: 'light',
        shadeIntensity: 0.65,
      },
    },
    plotOptions: {
      pie: {
        dataLabels: {
          offset: -5,
        },
      },
    },
    grid: {
      padding: {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },
    dataLabels: {
      enabled: true,
      style: {
        fontSize: '11px',
        fontWeight: '800',
        colors: ['#ffffff'],
      },
      dropShadow: {
        enabled: false,
      },
      formatter(val, opts) {
        const name = opts.w.globals.labels[opts.seriesIndex];
        return [name, val.toFixed(1) + '%'];
      },
    },
    title: {
      text: 'Modalidades de Carta Fianza',
      align: 'center',
      style: {
        fontSize: '13px',
        fontWeight: 900,
        color: '#0f172a'
      }
    },
    legend: {
      show: false,
    },
    tooltip: {
      theme: 'light',
      y: {
        formatter: (val) => `${val} Cartas`,
      },
    },
    stroke: {
      colors: ['#ffffff'],
      width: 2
    }
  }), [tiposFormatted]);

  const apexSeries = useMemo(() => tiposFormatted.map(t => t.value), [tiposFormatted]);

  if (loading || !metrics || !metrics.kpis) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] space-y-4">
        <div className="relative flex items-center justify-center">
          <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
          <div className="absolute w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-blue-600 animate-ping"></div>
          </div>
        </div>
        <p className="text-xs font-black uppercase tracking-widest text-slate-500">Cargando métricas del Dashboard...</p>
      </div>
    );
  }

  const top3PorVencer = metrics.fianzasPorVencerTop3 || [];
  const top3Vencidas = metrics.fianzasVencidasTop3 || [];

  // Top 4 crisp executive KPI cards (Count Focused)
  const kpiPills = [
    {
      id: 1,
      title: 'Total Cartas Fianza',
      value: `${metrics.kpis.fianzasActivas || totalCartasTipo}`,
      countSubtitle: 'Registradas en sistema',
      badgeText: '3 Modalidades',
      colorClass: 'blue',
      icon: <Layers size={24} strokeWidth={2.5} className="text-blue-600" />
    },
    {
      id: 2,
      title: 'Fianzas Vigentes',
      value: `${(metrics.kpis.fianzasActivas || totalCartasTipo) - (metrics.kpis.fianzasVencidas || top3Vencidas.length || 0)}`,
      countSubtitle: 'Portafolio activo seguro',
      badgeText: 'Plena Vigencia',
      colorClass: 'emerald',
      icon: <ShieldCheck size={24} strokeWidth={2.5} className="text-emerald-600" />
    },
    {
      id: 3,
      title: 'Próximos Vencimientos',
      value: `${metrics.kpis.vencimientosProximos || top3PorVencer.length || 0}`,
      countSubtitle: 'Próximos 30 días',
      badgeText: 'Alerta Preventiva',
      colorClass: 'amber',
      icon: <Clock size={24} strokeWidth={2.5} className="text-amber-600" />
    },
    {
      id: 4,
      title: 'Fianzas Vencidas',
      value: `${metrics.kpis.fianzasVencidas || top3Vencidas.length || 0}`,
      countSubtitle: 'Requieren atención',
      badgeText: 'Acción Inmediata',
      colorClass: 'rose',
      icon: <AlertTriangle size={24} strokeWidth={2.5} className="text-rose-600" />
    }
  ];

  return (
    <div className="w-full space-y-5 pb-8 font-sans select-none text-slate-900">
      
      {/* ========================================================================= */}
      {/* 0. DASHBOARD EXECUTIVE HEADER                                              */}
      {/* ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-400 rounded-full blur-[80px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-500"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 transform group-hover:scale-105 transition-all duration-300">
              <LayoutDashboard size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Panel de Control <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Ejecutivo</span>
              </h1>
              <p className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mt-0.5">
                <Activity size={13} className="text-blue-500" /> Monitoreo en tiempo real de portafolio
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <div className="hidden sm:flex items-center space-x-2 bg-slate-50 border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-xs">
            <div className="relative flex items-center justify-center">
              <span className="absolute w-2 h-2 rounded-full bg-emerald-500 animate-ping opacity-75"></span>
              <span className="relative w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              {new Date().toLocaleDateString('es-PE', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
          </div>

          <button
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-slate-900 to-slate-800 hover:from-blue-600 hover:to-indigo-600 text-white font-bold text-xs uppercase tracking-wider shadow-xs hover:shadow-md transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <RefreshCw size={13} className={`${refreshing ? 'animate-spin' : ''}`} strokeWidth={2.5} />
            <span>{refreshing ? 'Actualizando...' : 'Actualizar'}</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP 4 EXECUTIVE KPI STAT CARDS (COUNT FOCUSED)                         */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiPills.map((kpi) => {
          const colorStyles = {
            blue: 'from-blue-600 to-indigo-600 shadow-blue-500/30 text-blue-700 bg-blue-50 border-blue-200 bg-blue-400 group-hover:border-blue-300',
            emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/30 text-emerald-700 bg-emerald-50 border-emerald-200 bg-emerald-400 group-hover:border-emerald-300',
            amber: 'from-amber-500 to-orange-500 shadow-amber-500/30 text-amber-700 bg-amber-50 border-amber-200 bg-amber-400 group-hover:border-amber-300',
            rose: 'from-rose-500 to-pink-500 shadow-rose-500/30 text-rose-700 bg-rose-50 border-rose-200 bg-rose-400 group-hover:border-rose-300',
          };
          
          const parts = colorStyles[kpi.colorClass].split(' ');
          const gradientClass = parts[0] + ' ' + parts[1];
          const shadowClass = parts[2];
          const textClass = parts[3];
          const orbClass = parts[6];
          const hoverBorderClass = parts[7];

          const getDotStyle = (color) => {
            switch(color) {
              case 'blue': return 'bg-blue-500';
              case 'emerald': return 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]';
              case 'amber': return 'bg-amber-500';
              case 'rose': return 'bg-rose-500 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.6)]';
              default: return 'bg-slate-500';
            }
          };

          return (
            <div 
              key={kpi.id} 
              className={`rounded-2xl p-4.5 bg-white/95 backdrop-blur-xl border border-slate-200/80 ${hoverBorderClass} shadow-xs transition-all duration-200 hover:-translate-y-1 hover:shadow-md relative overflow-hidden group flex flex-col justify-between`}
            >
              {/* Orb effect background */}
              <div className={`absolute -top-8 -right-8 w-24 h-24 ${orbClass} rounded-full blur-[40px] opacity-10 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none`}></div>
              
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform duration-200">
                    {React.cloneElement(kpi.icon, { size: 18 })}
                  </div>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-200/60 bg-slate-50/80 w-max">
                    <span className={`w-1.5 h-1.5 rounded-full ${getDotStyle(kpi.colorClass)}`}></span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      {kpi.badgeText}
                    </span>
                  </div>
                </div>
                <ArrowUpRight size={16} className={`text-slate-300 group-hover:${textClass} transition-colors opacity-0 group-hover:opacity-100 transform`} />
              </div>

              <div className="relative z-10">
                <h4 className={`text-3xl font-black tracking-tight leading-none mb-1.5 font-mono text-transparent bg-clip-text bg-gradient-to-br ${gradientClass}`}>
                  {kpi.value}
                </h4>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-800">{kpi.title}</span>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                    {kpi.countSubtitle}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* 2. CRITICAL FEATURED WATCHLIST KPIS (TOP 3 POR VENCER & TOP 3 VENCIDAS)   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* KPI 1: TOP 3 FIANZAS POR VENCER */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-16 -right-16 w-36 h-36 bg-amber-400 rounded-full blur-[60px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-500"></div>
          
          <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-100 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20 transform group-hover:scale-105 transition-all duration-300">
                <Clock size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Top 3 <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Por Vencer</span>
                </h3>
                <p className="text-[11px] font-semibold text-slate-500">
                  Próximos vencimientos (renovación oportuna)
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-200/60 bg-slate-50/80 w-max">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                {top3PorVencer.length} Críticas
              </span>
            </div>
          </div>

          <div className="space-y-2.5 flex-1 relative z-10">
            {top3PorVencer.length > 0 ? (
              top3PorVencer.map((fianza, index) => {
                const tipoInfo = getTipoInfo(fianza.tipo);
                const dias = Number(fianza.dias_faltantes);
                const empresaNombre = fianza.empresa_nombre || fianza.consorcio_nombre || 'Empresa Titular';

                let badgeDias = { text: `Vence en ${dias} días`, dot: 'bg-amber-400' };
                if (dias === 0) {
                  badgeDias = { text: 'VENCE HOY', dot: 'bg-rose-500 animate-pulse' };
                } else if (dias === 1) {
                  badgeDias = { text: 'VENCE MAÑANA', dot: 'bg-orange-500 animate-pulse' };
                }

                return (
                  <div 
                    key={fianza.id || index}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-amber-300 hover:shadow-xs transition-all duration-200 group/card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-300 group-hover/card:text-amber-500 transition-colors">
                          0{index + 1}
                        </span>
                        <div 
                          onClick={() => copyToClipboard(fianza.numero, 'Número de Fianza')}
                          className="flex items-center space-x-1 cursor-pointer group/code bg-slate-50 hover:bg-amber-50 px-1.5 py-0.5 rounded-md transition-colors border border-transparent hover:border-amber-200"
                          title="Clic para copiar código de fianza"
                        >
                          <span className="font-mono font-black text-slate-700 text-xs tracking-tight group-hover/code:text-amber-700 transition-colors">
                            {fianza.numero}
                          </span>
                          <Copy size={11} className="text-slate-400 group-hover/code:text-amber-500 transition-colors" />
                        </div>
                        <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-100 bg-slate-50 w-max">
                          <span className={`w-1 h-1 rounded-full ${tipoInfo.dot}`}></span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                            {tipoInfo.shortLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-100 bg-slate-50 w-max">
                        <span className={`w-1.5 h-1.5 rounded-full ${badgeDias.dot}`}></span>
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wider">
                          {badgeDias.text}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
                          <Building2 size={10} className="text-slate-400 group-hover/card:text-amber-500 transition-colors" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 truncate" title={empresaNombre}>
                          {empresaNombre}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                        <div className="flex items-center space-x-1 text-slate-400">
                          <CalendarDays size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">
                            {fianza.fecha_vencimiento ? new Date(fianza.fecha_vencimiento).toLocaleDateString('es-PE') : 'S/F'}
                          </span>
                        </div>
                        <span className="font-mono font-black text-xs text-slate-900">
                          {formatCurrency(fianza.monto, fianza.moneda)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-5 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center h-full min-h-[140px]">
                <ShieldCheck size={24} className="text-slate-300 mb-1.5" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Todo al día
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 flex justify-between items-center border-t border-slate-100 relative z-10">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Revisión preventiva</span>
            <button 
              onClick={() => onNavigate && onNavigate('cartas-fianzas')}
              className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center space-x-1 hover:underline cursor-pointer transition-colors"
            >
              <span>Ver todas</span>
              <ChevronRight size={12} strokeWidth={3} />
            </button>
          </div>
        </div>

        {/* KPI 2: TOP 3 FIANZAS VENCIDAS */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -bottom-16 -left-16 w-36 h-36 bg-rose-400 rounded-full blur-[60px] opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity duration-500"></div>
          
          <div className="flex items-start justify-between pb-3 mb-3 border-b border-slate-100 relative z-10">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md shadow-rose-500/20 transform group-hover:scale-105 transition-all duration-300">
                <AlertTriangle size={18} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  Top 3 <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-pink-600">Vencidas</span>
                </h3>
                <p className="text-[11px] font-semibold text-slate-500">
                  Garantías con plazo cumplido (canje urgente)
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-200/60 bg-slate-50/80 w-max">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_6px_rgba(244,63,94,0.6)]"></span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                {top3Vencidas.length} Vencidas
              </span>
            </div>
          </div>

          <div className="space-y-2.5 flex-1 relative z-10">
            {top3Vencidas.length > 0 ? (
              top3Vencidas.map((fianza, index) => {
                const tipoInfo = getTipoInfo(fianza.tipo);
                const diasVencida = Math.abs(Number(fianza.dias_faltantes) || 0);
                const empresaNombre = fianza.empresa_nombre || fianza.consorcio_nombre || 'Empresa Titular';

                return (
                  <div 
                    key={fianza.id || index}
                    className="p-3 rounded-xl bg-white border border-slate-200/80 hover:border-rose-300 hover:shadow-xs transition-all duration-200 group/card"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-black text-slate-300 group-hover/card:text-rose-500 transition-colors">
                          0{index + 1}
                        </span>
                        <div 
                          onClick={() => copyToClipboard(fianza.numero, 'Número de Fianza')}
                          className="flex items-center space-x-1 cursor-pointer group/code bg-slate-50 hover:bg-rose-50 px-1.5 py-0.5 rounded-md transition-colors border border-transparent hover:border-rose-200"
                          title="Clic para copiar código de fianza"
                        >
                          <span className="font-mono font-black text-slate-700 text-xs tracking-tight group-hover/code:text-rose-700 transition-colors">
                            {fianza.numero}
                          </span>
                          <Copy size={11} className="text-slate-400 group-hover/code:text-rose-500 transition-colors" />
                        </div>
                        <div className="hidden md:flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-100 bg-slate-50 w-max">
                          <span className={`w-1 h-1 rounded-full ${tipoInfo.dot}`}></span>
                          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                            {tipoInfo.shortLabel}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-rose-100 bg-rose-50 w-max">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)] animate-pulse"></span>
                        <span className="text-[9px] font-bold text-rose-700 uppercase tracking-wider">
                          Hace {diasVencida} {diasVencida === 1 ? 'día' : 'días'}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex items-center space-x-1.5 min-w-0">
                        <div className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center border border-slate-200 shrink-0">
                          <Building2 size={10} className="text-slate-400 group-hover/card:text-rose-500 transition-colors" />
                        </div>
                        <span className="text-[11px] font-bold text-slate-700 truncate" title={empresaNombre}>
                          {empresaNombre}
                        </span>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end space-x-3 shrink-0">
                        <div className="flex items-center space-x-1 text-slate-400">
                          <CalendarDays size={10} />
                          <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600/80">
                            {fianza.fecha_vencimiento ? new Date(fianza.fecha_vencimiento).toLocaleDateString('es-PE') : 'S/F'}
                          </span>
                        </div>
                        <span className="font-mono font-black text-xs text-slate-900">
                          {formatCurrency(fianza.monto, fianza.moneda)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-5 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center h-full min-h-[140px]">
                <ShieldCheck size={24} className="text-slate-300 mb-1.5" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Excelente: No hay garantías vencidas
                </p>
              </div>
            )}
          </div>

          <div className="pt-3 mt-3 flex justify-between items-center border-t border-slate-100 relative z-10">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Gestión obligatoria</span>
            <button 
              onClick={() => onNavigate && onNavigate('cartas-fianzas')}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1 hover:underline cursor-pointer transition-colors"
            >
              <span>Ir al módulo</span>
              <ChevronRight size={12} strokeWidth={3} />
            </button>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 3. MIDDLE SECTION: DISTRIBUCIÓN POR TIPOS DE FIANZA & EVOLUCIÓN MENSUAL   */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* PASTEL MONOCROMO EN REACT (APEXCHARTS - TIPOS DE CARTA FIANZA) */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[320px] relative overflow-hidden">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-slate-950 tracking-tight">
                  Tipos de Carta Fianza
                </h3>
                <span className="bg-blue-50 border border-blue-200 text-blue-700 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Pastel Monocromo
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Distribución porcentual por modalidad contractual
              </p>
            </div>
            <span className="bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-0.5 text-xs font-bold">
              {totalCartasTipo} Cartas
            </span>
          </div>

          <div className="flex flex-col items-center justify-center w-full py-1">
            <div id="apex-pie-chart" className="w-full flex justify-center items-center">
              <ReactApexChart
                options={apexOptions}
                series={apexSeries}
                type="pie"
                width={280}
              />
            </div>
          </div>

          {/* Clean 3 bottom pill indicators for exact counts (No Monto Total) */}
          <div className="grid grid-cols-3 gap-2 w-full pt-2.5 border-t border-slate-100">
            {tiposFormatted.map((item, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-200/80 rounded-xl p-2 text-center shadow-xs">
                <span className="text-[9px] font-bold uppercase text-slate-500 tracking-wider block truncate">
                  {item.shortLabel}
                </span>
                <span className="text-xs sm:text-sm font-black font-mono text-slate-900 block mt-0.5">
                  {item.value} <span className="text-[10px] font-semibold text-slate-400">({item.percentage}%)</span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* EVOLUCIÓN MENSUAL DE EMISIONES (GRÁFICO DE BARRAS) */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[320px] relative overflow-hidden">
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm font-black text-slate-950 tracking-tight">
                  Evolución Mensual de Emisiones
                </h3>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider">
                  Histórico
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Cantidad de cartas fianza emitidas por mes
              </p>
            </div>
            <span className="bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-0.5 text-xs font-bold">
              Últimos 6 Meses
            </span>
          </div>

          <div className="w-full h-[180px] pt-2 flex items-center justify-center">
            {metrics.charts?.evolucionMensual && metrics.charts.evolucionMensual.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={metrics.charts.evolucionMensual} 
                  margin={{ top: 20, right: 10, left: -20, bottom: 0 }} 
                  barSize={24}
                >
                  <defs>
                    <linearGradient id="barActiveGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0284c7" stopOpacity={1}/>
                      <stop offset="100%" stopColor="#0369a1" stopOpacity={0.95}/>
                    </linearGradient>
                    <linearGradient id="barStandardGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis 
                    dataKey="mes" 
                    tickFormatter={formatMes}
                    tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                    axisLine={false}
                    tickLine={false}
                    dy={4}
                  />
                  <YAxis 
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <RechartsTooltip 
                    cursor={{ fill: 'rgba(2, 132, 199, 0.05)', radius: 6 }}
                    formatter={(value) => [`${value} Cartas`, 'Emitidas']}
                    labelFormatter={(label) => `Período: ${formatMes(label)}`}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e2e8f0', 
                      borderRadius: '10px', 
                      color: '#0f172a', 
                      fontSize: '11px', 
                      fontWeight: 700, 
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
                    }}
                  />
                  <Bar 
                    dataKey="total" 
                    radius={[6, 6, 0, 0]} 
                  >
                    <LabelList 
                      dataKey="total" 
                      position="top" 
                      fill="#0f172a" 
                      fontSize={10} 
                      fontWeight={800} 
                      offset={4}
                    />
                    {metrics.charts.evolucionMensual.map((_, index) => {
                      const isLast = index === metrics.charts.evolucionMensual.length - 1;
                      return <Cell key={`cell-bar-${index}`} fill={isLast ? 'url(#barActiveGrad)' : 'url(#barStandardGrad)'} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase tracking-wider">
                Sin datos de evolución cronológica
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-semibold text-slate-400">
            <span>Mayor emisión: {Math.max(...(metrics.charts?.evolucionMensual?.map(e => e.total) || [0]))} cartas/mes</span>
            <span className="text-sky-700 font-bold">Histórico activo</span>
          </div>
        </div>

      </div>

      {/* ========================================================================= */}
      {/* 4. BOTTOM SECTION: TOP EMPRESAS & ACTIVIDAD RECIENTE                      */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* TOP 5 EMPRESAS CON MAYOR VOLUMEN */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[340px]">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight">
                  Top Empresas & Consorcios
                </h3>
                <span className="text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Líderes
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Entidades con mayor volumen y concentración de fianzas
              </p>
            </div>
            <button 
              onClick={() => onNavigate && onNavigate('cartas-fianzas')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 hover:underline cursor-pointer"
            >
              <span>Ver Empresas</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-2 flex-1">
            {metrics.charts?.topEmpresas && metrics.charts.topEmpresas.length > 0 ? (
              metrics.charts.topEmpresas.map((empresa, index) => {
                const maxFianzas = metrics.charts.topEmpresas[0].total_fianzas || 1;
                const percentage = Math.max(((empresa.total_fianzas || 0) / maxFianzas) * 100, 8);
                
                const rankBadges = [
                  'bg-amber-400 text-slate-950 border-amber-500 font-bold',
                  'bg-slate-200 text-slate-800 border-slate-300 font-bold',
                  'bg-amber-700/20 text-amber-900 border-amber-600/30 font-bold',
                  'bg-slate-100 text-slate-700 border-slate-200 font-semibold',
                  'bg-slate-100 text-slate-700 border-slate-200 font-semibold'
                ];

                return (
                  <div 
                    key={index} 
                    className="p-2.5 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 transition-all duration-200"
                  >
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center space-x-2.5 min-w-0 pr-2">
                        <span className={`w-5 h-5 rounded-md text-[10px] flex items-center justify-center border flex-shrink-0 ${rankBadges[index] || rankBadges[3]}`}>
                          {index + 1}
                        </span>
                        <div className="truncate">
                          <span className="text-xs font-bold text-slate-900 truncate block">
                            {empresa.empresa}
                          </span>
                          <div className="flex items-center space-x-1.5 text-[9px] font-semibold text-slate-400 mt-0.5">
                            <span>FC: {empresa.totalFC || 0}</span>
                            <span>•</span>
                            <span>AD: {empresa.totalAD || 0}</span>
                            <span>•</span>
                            <span>AM: {empresa.totalAM || 0}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <span className="text-xs font-mono font-bold text-blue-600">
                          {empresa.total_fianzas || 0} Cartas
                        </span>
                      </div>
                    </div>

                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="flex items-center justify-center h-36 text-xs text-slate-400 uppercase font-bold">
                No hay registros de empresas
              </div>
            )}
          </div>
        </div>

        {/* ACTIVIDAD RECIENTE (ÚLTIMAS FIANZAS REGISTRADAS) */}
        <div className="bg-white/95 backdrop-blur-xl border border-slate-200/80 shadow-xs p-4 sm:p-5 rounded-2xl flex flex-col justify-between min-h-[340px]">
          <div className="flex items-center justify-between mb-3.5">
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-black text-slate-950 tracking-tight">
                  Actividad Reciente
                </h3>
                <span className="text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Nuevos Ingresos
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-semibold mt-0.5">
                Últimas cartas fianza incorporadas al sistema
              </p>
            </div>
            <button 
              onClick={() => onNavigate && onNavigate('cartas-fianzas')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-0.5 hover:underline cursor-pointer"
            >
              <span>Ver Todo</span>
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <div className="overflow-x-auto custom-scrollbar flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 text-slate-400 text-[10px] uppercase tracking-wider font-bold">
                  <th className="pb-2 px-2.5">Fianza</th>
                  <th className="pb-2 px-2.5">Titular</th>
                  <th className="pb-2 px-2.5">Modalidad</th>
                  <th className="pb-2 px-2.5 text-right">Monto</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-800 font-semibold">
                {metrics.recentActivity && metrics.recentActivity.length > 0 ? (
                  metrics.recentActivity.map((item, index) => {
                    const tipoInfo = getTipoInfo(item.tipo);
                    return (
                      <tr 
                        key={index} 
                        className="border-b border-slate-100 last:border-0 hover:bg-blue-50/40 transition-colors"
                      >
                        <td className="py-2 px-2.5">
                          <button
                            onClick={() => copyToClipboard(item.numero, 'Fianza')}
                            className="font-mono font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 cursor-pointer text-xs"
                            title="Copiar código"
                          >
                            <span>{item.numero}</span>
                          </button>
                        </td>
                        <td className="py-2 px-2.5 font-bold text-slate-900 truncate max-w-[120px] text-xs">
                          {item.empresa || 'Empresa Titular'}
                        </td>
                        <td className="py-2 px-2.5">
                          <div className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-slate-100 bg-slate-50 w-max">
                            <span className={`w-1 h-1 rounded-full ${tipoInfo.dot}`}></span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                              {tipoInfo.shortLabel}
                            </span>
                          </div>
                        </td>
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-slate-950 text-xs">
                          {formatCurrency(item.monto, item.moneda)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-xs font-semibold uppercase text-slate-400">
                      No hay actividad reciente registrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
