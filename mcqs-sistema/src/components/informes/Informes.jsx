import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api';
import { BarChart, Bar, PieChart, Pie, Legend, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const CustomSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!isOpen) setSearchTerm('');
  }, [isOpen]);

  const selectedOption = options.find(opt => String(opt.value) === String(value)) || options[0];
  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="relative" ref={selectRef}>
      <div 
        className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-950 cursor-pointer flex justify-between items-center transition-all hover:bg-slate-50 hover:border-blue-400 shadow-xs"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="truncate">{selectedOption?.label}</span>
        <svg className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {isOpen && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl py-1 max-h-56 flex flex-col ring-1 ring-slate-200/60 text-slate-950">
          {options.length > 5 && (
            <div className="px-2.5 pb-1.5 mb-1 border-b border-slate-100">
              <input 
                type="text"
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-950 focus:outline-none focus:border-blue-500 placeholder-slate-400"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
          <div className="overflow-y-auto custom-scrollbar flex-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt, i) => (
                <div 
                  key={i} 
                  className={`px-3 py-1.5 text-xs font-medium cursor-pointer transition-colors hover:bg-slate-50 ${String(value) === String(opt.value) ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-950'}`}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                >
                  {opt.label}
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-xs font-medium text-slate-400">No hay resultados</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Informes = () => {
  const [tipoInforme, setTipoInforme] = useState('fianzas');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [empresas, setEmpresas] = useState([]);
  const [empresaId, setEmpresaId] = useState('');
  
  const [estadoFianza, setEstadoFianza] = useState('');
  const [facturaObservada, setFacturaObservada] = useState('');

  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchEmpresas = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/empresas`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.ok) {
          const data = await res.json();
          setEmpresas(data);
        }
      } catch (err) {
        console.error('Error al cargar empresas:', err);
      }
    };
    fetchEmpresas();
  }, []);

  const generarInforme = async () => {
    setLoading(true);
    setResultados([]);
    
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (empresaId) params.append('empresa_id', empresaId);

      if (tipoInforme === 'fianzas' && estadoFianza) {
        params.append('estado', estadoFianza);
      }
      if (tipoInforme === 'facturas' && facturaObservada !== '') {
        params.append('observada', facturaObservada);
      }

      const res = await fetch(`${API_BASE_URL}/api/informes/${tipoInforme}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        setResultados(data);
      } else {
        console.error('Error del servidor al generar informe');
      }
    } catch (err) {
      console.error('Error de red al generar informe:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportarCSV = () => {
    if (resultados.length === 0) return;

    const headers = Object.keys(resultados[0]).join(',');
    const rows = resultados.map(row => 
      Object.values(row).map(val => `"${val || ''}"`).join(',')
    ).join('\n');

    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `informe_${tipoInforme}_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val) => new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(val || 0);

  const formatTipo = (str) => {
    if (!str || typeof str !== 'string') return 'Desconocido';
    return str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  };

  const getDatosGrafico = () => {
    const agrupado = {};
    resultados.forEach(r => {
      const tipo = formatTipo(r.tipo || r.tipo_fianza || r.tipo_carta || 'Otros');
      if (!agrupado[tipo]) {
        agrupado[tipo] = { nombre: tipo, monto: 0, cantidad: 0 };
      }
      agrupado[tipo].monto += (parseFloat(r.monto) || parseFloat(r.monto_carta) || 0);
      agrupado[tipo].cantidad += 1;
    });
    return Object.values(agrupado);
  };

  const datosGrafico = getDatosGrafico();
  const COLORS = ['#2563eb', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

  const [exportingPDF, setExportingPDF] = useState(false);
  const exportarPDF = async () => {
    if (resultados.length === 0) return;
    setExportingPDF(true);
    try {
      const doc = new jsPDF('l', 'mm', 'a4');
      
      const getRowDate = (row) => {
        const d = row.fecha_inicio || row.fecha_salida || row.fecha_registro || '';
        return d ? new Date(d).getTime() : 0;
      };
      const sortedResultados = [...resultados].sort((a, b) => getRowDate(b) - getRowDate(a));
      
      const colorPrimaryRed = 15;
      const colorPrimaryGreen = 23;
      const colorPrimaryBlue = 42;
      
      const colorMutedRed = 100;
      const colorMutedGreen = 116;
      const colorMutedBlue = 139;
      
      const colorBorderRed = 226;
      const colorBorderGreen = 232;
      const colorBorderBlue = 240;
      
      const margin = 14;
      const empLabel = empresaId ? (empresas.find(e => e.id === parseInt(empresaId))?.nombre || '').toUpperCase() : 'TODAS LAS EMPRESAS';
      
      const groupedResultados = sortedResultados.reduce((acc, row) => {
        const tipo = formatTipo(row.tipo || row.tipo_fianza || row.tipo_carta || 'Otros');
        if (!acc[tipo]) acc[tipo] = [];
        acc[tipo].push(row);
        return acc;
      }, {});
      
      const totalGeneralFacturasSoles = resultados.filter(r => r.monto_factura !== undefined).reduce((acc, curr) => acc + (parseFloat(curr.monto_factura) || 0), 0);

      Object.entries(groupedResultados).forEach(([tipoGrupo, rowsGrupo], index) => {
        if (index > 0) {
          doc.addPage();
        }
        
        let yPos = 18;
        
        doc.setFillColor(colorPrimaryRed, colorPrimaryGreen, colorPrimaryBlue);
        doc.rect(margin, yPos, 269, 14, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        const headerText = `${tipoGrupo.toUpperCase()} - ${empLabel}`;
        doc.text(headerText, margin + 6, yPos + 9);
        
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(`EMISIÓN: ${new Date().toLocaleDateString('es-PE')}`, margin + 263, yPos + 9, { align: 'right' });
        
        yPos += 22;
        
        const keys = Object.keys(rowsGrupo[0]).filter(key => 
          !['id', 'empresa_ruc', 'moneda', 'estado', 'empresa'].includes(key.toLowerCase())
        );
        
        const tableHeaders = ['N°', ...keys.map(key => {
          if (key.toLowerCase() === 'tipo_fianza' || key.toLowerCase() === 'tipo_carta') return 'TIPO DE FIANZA';
          if (key.toLowerCase() === 'detalle_observacion') return 'DETALLE OBSERVACIÓN';
          if (key.toLowerCase() === 'numero_fianza') return 'CARTA FIANZA ASOC.';
          return key.replace(/_/g, ' ').toUpperCase();
        })];
        
        const tableData = rowsGrupo.map((row, rIdx) => [
          (rIdx + 1).toString(),
          ...keys.map(key => {
            const val = row[key];
            if (key.toLowerCase().includes('fecha') && val) {
              const dateObj = new Date(val);
              return dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
            } else if (key === 'monto' || key === 'monto_carta' || key === 'monto_factura') {
              const currencySymbol = row.moneda === 'USD' ? '$' : 'S/';
              return `${currencySymbol} ${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(val || 0)}`;
            } else if (val === 1 || val === true) {
              return 'SÍ';
            } else if (val === 0 || val === false) {
              return 'NO';
            } else if (!val) {
              return '---';
            } else if (typeof val === 'string' && val.includes('_') && key !== 'numero') {
              return val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
            }
            return val;
          })
        ]);
        
        autoTable(doc, {
          startY: yPos,
          head: [tableHeaders],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [colorPrimaryRed, colorPrimaryGreen, colorPrimaryBlue],
            textColor: [255, 255, 255],
            fontSize: 8.5,
            fontStyle: 'bold',
            halign: 'left',
            cellPadding: 4.5
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [15, 23, 42],
            font: 'helvetica',
            fontStyle: 'bold',
            cellPadding: 4
          },
          alternateRowStyles: {
            fillColor: [248, 250, 252]
          },
          margin: { left: margin, right: margin, top: 32, bottom: 22 },
          styles: {
            overflow: 'linebreak',
            lineColor: [226, 232, 240],
            lineWidth: 0.1
          },
          columnStyles: {
            0: { halign: 'center', fontStyle: 'bold', cellWidth: 12, textColor: [71, 85, 105] },
            ...keys.reduce((acc, key, idx) => {
              if (['monto', 'monto_carta', 'monto_factura'].includes(key.toLowerCase())) {
                acc[idx + 1] = { halign: 'right', fontStyle: 'bold', textColor: [37, 99, 235] };
              }
              return acc;
            }, {})
          }
        });

        const totalFacturasTipo = rowsGrupo.reduce((acc, curr) => acc + (parseFloat(curr.monto_factura || curr.monto) || 0), 0);
        
        let finalY = doc.lastAutoTable.finalY + 8;
        if (finalY > 175) {
          doc.addPage();
          finalY = 25;
        }

        doc.setFillColor(245, 247, 250);
        doc.rect(margin, finalY, 269, 12, 'F');
        doc.setDrawColor(colorBorderRed, colorBorderGreen, colorBorderBlue);
        doc.setLineWidth(0.2);
        doc.rect(margin, finalY, 269, 12, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(colorPrimaryRed, colorPrimaryGreen, colorPrimaryBlue);
        
        const labelTotal = tipoInforme === 'fianzas' 
          ? `TOTAL MONTO FIANZAS (${tipoGrupo.toUpperCase()}):`
          : `TOTAL MONTO FACTURAS (${tipoGrupo.toUpperCase()}):`;

        doc.text(labelTotal, margin + 5, finalY + 8);

        doc.setTextColor(217, 119, 6);
        doc.text(`S/ ${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(totalFacturasTipo)}`, margin + 263, finalY + 8, { align: 'right' });
      });

      if (tipoInforme === 'facturas' || tipoInforme === 'general') {
        let finalY = doc.lastAutoTable.finalY + 24;
        if (finalY > 175) {
          doc.addPage();
          finalY = 25;
        }

        doc.setFillColor(245, 247, 250);
        doc.rect(margin, finalY, 269, 14, 'F');
        doc.setDrawColor(colorBorderRed, colorBorderGreen, colorBorderBlue);
        doc.setLineWidth(0.2);
        doc.rect(margin, finalY, 269, 14, 'S');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(colorPrimaryRed, colorPrimaryGreen, colorPrimaryBlue);
        doc.text("TOTAL GENERAL DE MONTO DE FACTURAS:", margin + 5, finalY + 9.5);

        doc.setTextColor(217, 119, 6);
        doc.text(`S/ ${new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2 }).format(totalGeneralFacturasSoles)}`, margin + 263, finalY + 9.5, { align: 'right' });
      }
      
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(colorMutedRed, colorMutedGreen, colorMutedBlue);
        
        doc.setDrawColor(colorBorderRed, colorBorderGreen, colorBorderBlue);
        doc.line(margin, doc.internal.pageSize.getHeight() - 15, doc.internal.pageSize.getWidth() - margin, doc.internal.pageSize.getHeight() - 15);
        
        doc.text("MCQS-JCQ  |  Reporte de Gestión Ejecutiva", margin, doc.internal.pageSize.getHeight() - 10);
        doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.getWidth() - margin - 20, doc.internal.pageSize.getHeight() - 10);
      }
      
      doc.save(`reporte_ejecutivo_${tipoInforme}_${new Date().getTime()}.pdf`);
    } catch (err) {
      console.error("Error al exportar PDF: ", err);
      alert("Error al exportar PDF: " + err.message);
    } finally {
      setExportingPDF(false);
    }
  };

  return (
    <div className="w-full space-y-4 pb-8">
      {/* Header */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 text-slate-900 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Analítica & Reportes</span>
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-950 tracking-tight">
            Generador de <span className="text-blue-600">Informes</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Motor de Reportes Avanzados, Gráficos y Exportación PDF / CSV
          </p>
        </div>
      </div>

      {/* Panel de Filtros */}
      <div className="bg-white border border-slate-200/80 p-4 sm:p-5 rounded-2xl text-slate-900 shadow-xs transition-all">
        <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider mb-3.5 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Configuración del Reporte
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3.5">
          {/* Tipo de Informe */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tipo de Datos</label>
            <CustomSelect 
              value={tipoInforme}
              onChange={(val) => { setTipoInforme(val); setResultados([]); }}
              options={[
                { value: 'fianzas', label: 'Cartas Fianza' },
                { value: 'facturas', label: 'Facturas' },
                { value: 'general', label: 'General (Cartas + Facturas)' }
              ]}
            />
          </div>

          {/* Empresa */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Empresa / Consorcio</label>
            <CustomSelect 
              value={empresaId}
              onChange={(val) => setEmpresaId(val)}
              options={[
                { value: '', label: '-- Todas las Empresas --' },
                ...empresas.map(emp => ({ value: emp.id, label: emp.nombre || emp.consorcio }))
              ]}
            />
          </div>

          {/* Fecha Inicio */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha Desde</label>
            <input 
              type="date" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all cursor-pointer"
            />
          </div>

          {/* Fecha Fin */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Fecha Hasta</label>
            <input 
              type="date" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-medium text-slate-950 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all cursor-pointer"
            />
          </div>

          {/* Filtros dinámicos según el tipo */}
          {tipoInforme === 'fianzas' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado de Fianza</label>
              <CustomSelect 
                value={estadoFianza}
                onChange={(val) => setEstadoFianza(val)}
                options={[
                  { value: '', label: '-- Todos los estados --' },
                  { value: 'Vigente', label: 'Vigente' },
                  { value: 'Vencida', label: 'Vencida' },
                  { value: 'Renovada', label: 'Renovada' },
                  { value: 'Liberada', label: 'Liberada' }
                ]}
              />
            </div>
          )}

          {tipoInforme === 'facturas' && (
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Estado de Factura</label>
              <CustomSelect 
                value={facturaObservada}
                onChange={(val) => setFacturaObservada(val)}
                options={[
                  { value: '', label: '-- Todos --' },
                  { value: 'false', label: 'Sin Observaciones' },
                  { value: 'true', label: 'Observadas' }
                ]}
              />
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
          <button 
            onClick={generarInforme}
            disabled={loading}
            className="bg-slate-950 hover:bg-slate-900 text-white text-xs font-bold tracking-wider uppercase px-5 py-2.5 rounded-xl transition-all shadow-xs active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
          >
            {loading ? (
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            <span>Generar Reporte</span>
          </button>
        </div>
      </div>

      {/* Resultados */}
      {resultados.length > 0 && (
        <div id="reporte-dashboard" className="space-y-4 animate-fadeIn">
          
          <div className="flex justify-between items-center px-1">
            <h2 className="text-xs font-black tracking-tight text-slate-950 uppercase">
              Dashboard Gerencial
            </h2>
            <div className="flex gap-2">
              <button 
                onClick={exportarCSV}
                className="bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs"
              >
                CSV
              </button>
              <button 
                onClick={exportarPDF}
                disabled={exportingPDF}
                className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
              >
                {exportingPDF ? 'Exportando...' : 'Exportar PDF'}
              </button>
            </div>
          </div>

          {/* Tarjetas de Resumen */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between text-slate-950">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-emerald-600 mb-0.5">Total Cartas Fianza</p>
                <h3 className="text-xl font-black font-mono text-slate-950">
                  {formatCurrency(resultados.reduce((acc, curr) => acc + (parseFloat(curr.monto) || parseFloat(curr.monto_carta) || 0), 0))}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-xs border border-emerald-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between text-slate-950">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-purple-600 mb-0.5">Total Facturas</p>
                <h3 className="text-xl font-black font-mono text-slate-950">
                  {formatCurrency(resultados.reduce((acc, curr) => acc + (parseFloat(curr.monto_factura) || 0), 0))}
                </h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-xs border border-purple-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" />
                </svg>
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 flex items-center justify-between text-slate-950">
              <div>
                <p className="text-[10px] font-bold tracking-wider uppercase text-blue-600 mb-0.5">Registros Encontrados</p>
                <h3 className="text-xl font-black font-mono text-slate-950">{resultados.length} <span className="text-xs font-medium font-sans text-slate-500">docs</span></h3>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs border border-blue-100">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Gráficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 text-slate-900">
              <h4 className="text-xs font-black tracking-wider text-slate-950 uppercase mb-3">Montos por Tipo</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={datosGrafico} margin={{ top: 15, right: 20, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorBarReport" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.9}/>
                        <stop offset="95%" stopColor="#1d4ed8" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="nombre" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} dy={5} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 'bold' }} tickFormatter={(val) => `S/ ${val/1000}k`} dx={-5} />
                    <RechartsTooltip 
                      formatter={(value) => formatCurrency(value)}
                      cursor={{ fill: 'rgba(241,245,249,0.6)' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 'bold', fontSize: '11px' }}
                    />
                    <Bar dataKey="monto" fill="url(#colorBarReport)" radius={[6, 6, 0, 0]} maxBarSize={45}>
                      <LabelList 
                        dataKey="monto" 
                        position="top" 
                        formatter={(val) => `S/ ${(val/1000).toFixed(1)}k`} 
                        style={{ fontSize: '10px', fill: '#0f172a', fontWeight: '900' }} 
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/80 text-slate-900 flex flex-col justify-between">
              <h4 className="text-xs font-black tracking-wider text-slate-950 uppercase mb-2">Volumen de Documentos</h4>
              <div className="h-[200px] w-full flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={datosGrafico}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="cantidad"
                      nameKey="nombre"
                      label={({ value }) => `${value}`}
                      labelStyle={{ fontSize: '11px', fontWeight: 'bold', fill: '#0f172a' }}
                    >
                      {datosGrafico.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#ffffff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', backgroundColor: '#ffffff', color: '#0f172a', fontWeight: 'bold', fontSize: '11px' }} 
                    />
                    <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', color: '#64748b' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {(() => {
            const getRowDate = (row) => {
              const d = row.fecha_inicio || row.fecha_salida || row.fecha_registro || '';
              return d ? new Date(d).getTime() : 0;
            };
            const sortedUI = [...resultados].sort((a, b) => getRowDate(b) - getRowDate(a));

            const groupedResultados = sortedUI.reduce((acc, row) => {
              const tipo = formatTipo(row.tipo || row.tipo_fianza || row.tipo_carta || 'Otros');
              if (!acc[tipo]) acc[tipo] = [];
              acc[tipo].push(row);
              return acc;
            }, {});

            return Object.entries(groupedResultados).map(([tipoGrupo, rowsGrupo], indexGrupo) => {
              const totalMonto = rowsGrupo.reduce((acc, curr) => acc + (parseFloat(curr.monto) || parseFloat(curr.monto_carta) || parseFloat(curr.monto_factura) || 0), 0);
              const totalFactura = rowsGrupo.reduce((acc, curr) => acc + (parseFloat(curr.monto_factura) || 0), 0);
              const hasFacturas = totalFactura > 0;
              const keys = Object.keys(rowsGrupo[0]).filter(key => !['id', 'empresa_ruc', 'moneda', 'estado', 'tipo', 'tipo_fianza', 'tipo_carta'].includes(key.toLowerCase()));

              return (
                <div key={indexGrupo} className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-xs overflow-hidden mb-4 text-slate-900">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-xs font-black text-slate-950 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-4 bg-blue-600 rounded-full"></span>
                      {tipoGrupo}
                    </h3>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar pb-1">
                    <table className="w-full text-left border-collapse min-w-[800px] text-xs">
                      <thead>
                        <tr className="border-b border-slate-200/80 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                          <th className="pb-2 px-2.5 text-center w-10">
                            N°
                          </th>
                          {keys.map((key) => (
                            <th key={key} className="pb-2 px-3">
                              {key.replace(/_/g, ' ')}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="text-slate-900 divide-y divide-slate-100">
                        {rowsGrupo.map((row, index) => (
                          <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-2.5 px-2.5 text-xs font-bold text-center text-slate-400">
                              {index + 1}
                            </td>
                            {keys.map((key, i) => {
                              const val = row[key];
                              let displayVal = val;
                              
                              if (key.toLowerCase().includes('fecha') && val) {
                                const dateObj = new Date(val);
                                displayVal = dateObj.toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
                              } else if (key === 'monto' || key === 'monto_carta' || key === 'monto_factura') {
                                displayVal = formatCurrency(val);
                              } else if (val === 1 || val === true) {
                                displayVal = 'SÍ';
                              } else if (val === 0 || val === false) {
                                displayVal = 'NO';
                              } else if (!val) {
                                displayVal = '---';
                              } else if (typeof val === 'string' && val.includes('_') && key !== 'numero') {
                                displayVal = val.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
                              }
                              
                              return (
                                <td key={i} className={`py-2.5 px-3 text-xs ${(key === 'monto' || key === 'monto_carta' || key === 'monto_factura') ? 'text-blue-600 font-mono font-black' : 'font-medium text-slate-950'}`}>
                                  {displayVal}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan={keys.length + 1} className="py-3 px-3 text-right border-t border-slate-100 block sm:table-cell">
                            <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase">Total {tipoGrupo}</span>
                              <span className="text-sm font-black text-slate-950 font-mono">{formatCurrency(totalMonto)}</span>
                              {hasFacturas && <span className="text-xs font-bold text-slate-500">Facturas: <span className="text-blue-600 font-mono font-black">{formatCurrency(totalFactura)}</span></span>}
                            </div>
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              );
            });
          })()}
        </div>
      )}
    </div>
  );
};

export default Informes;


