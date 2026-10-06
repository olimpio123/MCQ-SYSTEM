import React, { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../config/api';
import { Search, X, Command, LayoutDashboard, ShieldCheck, RefreshCw, FileText, FolderOpen, Package, Building2, TrendingUp, AlertTriangle, Clock, ArrowRight, Building, ArrowUpRight, Sparkles, Copy, Check, Share2, Printer, ExternalLink, CalendarDays, AlertCircle } from 'lucide-react';

const GlobalSearch = ({ onNavigate, onOpenEmpresaFianza, onOpenEmpresaFactura, onOpenExpediente, onOpenCargo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('todos');
  const [results, setResults] = useState({ empresas: [], fianzas: [], expedientes: [], facturas: [], cargos: [] });
  const [obligaciones, setObligaciones] = useState({ fianzasUrgentes: [], facturasObservadas: [] });
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copiedText, setCopiedText] = useState(null);

  const categoryColors = {
    empresas: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', gradient: 'from-blue-500 to-indigo-500', hover: 'hover:bg-blue-100' },
    fianzas: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100', gradient: 'from-orange-500 to-red-500', hover: 'hover:bg-orange-100' },
    facturas: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100', gradient: 'from-emerald-500 to-teal-500', hover: 'hover:bg-emerald-100' },
    expedientes: { bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-100', gradient: 'from-purple-500 to-fuchsia-500', hover: 'hover:bg-purple-100' },
    cargos: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100', gradient: 'from-rose-500 to-pink-500', hover: 'hover:bg-rose-100' }
  };

  const handleCopyAction = (text, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const inputRef = useRef(null);
  const modalRef = useRef(null);

  // Cargar búsquedas recientes del localStorage
  useEffect(() => {
    const saved = localStorage.getItem('mcqs_recent_searches');
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  // Cargar obligaciones en vivo cuando el modal se abre
  useEffect(() => {
    if (isOpen) {
      fetch(`${API_BASE_URL}/api/search/obligaciones`)
        .then(res => res.json())
        .then(data => {
          if (data && (data.fianzasUrgentes || data.facturasObservadas)) {
            setObligaciones(data);
          }
        })
        .catch(err => console.error('Error cargando obligaciones:', err));
    }
  }, [isOpen]);

  const saveRecentSearch = (category, item) => {
    const newEntry = { category, item, id: `${category}-${item.id}`, timestamp: new Date().toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' }) };
    const filtered = recentSearches.filter(s => s.id !== newEntry.id);
    const updated = [newEntry, ...filtered].slice(0, 6);
    setRecentSearches(updated);
    localStorage.setItem('mcqs_recent_searches', JSON.stringify(updated));
  };

  // Keyboard shortcut Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current.focus(), 80);
      setSearchTerm('');
      setSelectedFilter('todos');
      setSelectedIndex(0);
      setResults({ empresas: [], fianzas: [], expedientes: [], facturas: [], cargos: [] });
    }
  }, [isOpen]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Debounced Search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm.trim().length > 1) {
        performSearch(searchTerm);
      } else {
        setResults({ empresas: [], fianzas: [], expedientes: [], facturas: [], cargos: [] });
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const performSearch = async (query) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data = await response.json();
        setResults({
          empresas: data.empresas || [],
          fianzas: data.fianzas || [],
          expedientes: data.expedientes || [],
          facturas: data.facturas || [],
          cargos: data.cargos || []
        });
        setSelectedIndex(0);
      }
    } catch (error) {
      console.error("Error searching:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (category, item) => {
    setIsOpen(false);
    saveRecentSearch(category, item);
    
    switch(category) {
      case 'empresas':
        if (onOpenEmpresaFianza) onOpenEmpresaFianza({ id: item.id, nombre: item.nombre });
        break;
      case 'fianzas':
        if (onOpenEmpresaFianza) {
          if (item.empresa_id) {
            onOpenEmpresaFianza({ id: item.empresa_id, nombre: item.empresa_nombre, fianzaId: item.id, tipo: item.tipo });
          } else if (item.consorcio_id) {
            onOpenEmpresaFianza({ id: item.consorcio_id, nombre: item.consorcio_nombre, fianzaId: item.id, tipo: item.tipo });
          } else {
            onNavigate('cartas-fianzas');
          }
        }
        break;
      case 'expedientes':
        if (onOpenExpediente) onOpenExpediente(item);
        break;
      case 'facturas':
        if (onOpenEmpresaFactura) {
          if (item.empresa_id) {
            onOpenEmpresaFactura({ id: item.empresa_id, nombre: item.empresa_nombre, facturaId: item.id, tipo: item.tipo_fianza });
          } else {
            onNavigate('facturas');
          }
        }
        break;
      case 'cargos':
        if (onOpenCargo && item.tipo_cargo) {
          onOpenCargo(item.tipo_cargo);
        } else if (onNavigate) {
          onNavigate('cargos');
        }
        break;
      case 'tramites':
        if (onNavigate) onNavigate('tramites-huanuco');
        break;
      default:
        break;
    }
  };

  // Filtrado de items por pestaña activa
  const getFilteredItems = () => {
    const list = [];
    if (selectedFilter === 'todos' || selectedFilter === 'empresas') {
      results.empresas.forEach(item => list.push({ category: 'empresas', data: item, key: `emp-${item.id}` }));
    }
    if (selectedFilter === 'todos' || selectedFilter === 'fianzas') {
      results.fianzas.forEach(item => list.push({ category: 'fianzas', data: item, key: `fia-${item.id}` }));
    }
    if (selectedFilter === 'todos' || selectedFilter === 'facturas') {
      results.facturas.forEach(item => list.push({ category: 'facturas', data: item, key: `fac-${item.id}` }));
    }
    if (selectedFilter === 'todos' || selectedFilter === 'expedientes') {
      results.expedientes.forEach(item => list.push({ category: 'expedientes', data: item, key: `exp-${item.id}` }));
    }
    if (selectedFilter === 'todos' || selectedFilter === 'cargos') {
      (results.cargos || []).forEach(item => list.push({ category: 'cargos', data: item, key: `car-${item.id}` }));
    }
    return list;
  };

  const filteredItems = getFilteredItems();
  const activeItem = filteredItems[selectedIndex] || null;

  // Manejo de teclado dentro del modal
  const handleKeyDown = (e) => {
    if (filteredItems.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredItems.length) % filteredItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeItem) {
        handleSelect(activeItem.category, activeItem.data);
      }
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      // Si presiona Ctrl+C y hay un item activo, copiar el código o nombre principal
      if (activeItem) {
        e.preventDefault();
        const copyData = activeItem.data.codigo || activeItem.data.ruc || activeItem.data.numero || activeItem.data.nombre;
        if (copyData) handleCopyAction(copyData);
      }
    }
  };

  // Función para calcular estado de vencimiento
  const getEstadoBadge = (fechaVencimiento) => {
    if (!fechaVencimiento) return null;
    const dias = Math.ceil((new Date(fechaVencimiento) - new Date()) / (1000 * 60 * 60 * 24));
    if (dias < 0) return { label: 'Vencida', color: 'bg-red-100 text-red-700 border-red-200', icon: AlertTriangle };
    if (dias <= 15) return { label: `Vence en ${dias} días`, color: 'bg-orange-100 text-orange-700 border-orange-200', icon: Clock };
    return { label: 'Al día', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Check };
  };

  const totalResultsCount = results.empresas.length + results.fianzas.length + results.facturas.length + results.expedientes.length + (results.cargos?.length || 0);

  const quickNavLinks = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, view: 'dashboard', color: 'from-indigo-500 to-indigo-600', bg: 'group-hover:bg-indigo-50' },
    { id: 'fianzas', label: 'Cartas Fianza', icon: ShieldCheck, view: 'cartas-fianzas', color: 'from-blue-500 to-blue-600', bg: 'group-hover:bg-blue-50' },
    { id: 'renovaciones', label: 'Renovaciones', icon: RefreshCw, view: 'renovaciones', color: 'from-cyan-500 to-cyan-600', bg: 'group-hover:bg-cyan-50' },
    { id: 'facturas', label: 'Facturación', icon: FileText, view: 'facturas', color: 'from-rose-500 to-rose-600', bg: 'group-hover:bg-rose-50' },
    { id: 'expedientes', label: 'Expedientes', icon: FolderOpen, view: 'expedientes', color: 'from-emerald-500 to-emerald-600', bg: 'group-hover:bg-emerald-50' },
    { id: 'cargos', label: 'Cargos', icon: Package, view: 'cargos', color: 'from-violet-500 to-violet-600', bg: 'group-hover:bg-violet-50' },
    { id: 'tramites', label: 'Mesa Huánuco', icon: Building2, view: 'tramites-huanuco', color: 'from-orange-500 to-orange-600', bg: 'group-hover:bg-orange-50' },
    { id: 'informes', label: 'Informes', icon: TrendingUp, view: 'informes', color: 'from-pink-500 to-pink-600', bg: 'group-hover:bg-pink-50' },
  ];

  return (
    <>
      {/* Botón flotante Spotlight */}
      <div className="fixed bottom-8 right-8 z-40">
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-white hover:bg-slate-50 text-slate-900 p-3.5 sm:p-4 rounded-full shadow-[0_15px_35px_rgba(0,0,0,0.12)] hover:shadow-xl hover:scale-105 transition-all duration-300 group flex items-center justify-center border border-slate-200 ring-4 ring-white cursor-pointer"
          title="Abrir MCQS Spotlight (Ctrl + K)"
        >
          <Command className="w-5 h-5 relative z-10 text-blue-600 group-hover:rotate-12 transition-transform duration-300" strokeWidth={2.2} />
          <span className="absolute -top-12 right-0 bg-white border border-slate-200 text-slate-950 text-xs font-black px-3.5 py-1.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap shadow-xl transform translate-y-2 group-hover:translate-y-0">
            MCQS Command Center <kbd className="ml-1 px-2 py-0.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-mono border border-slate-200">Ctrl+K</kbd>
          </span>
        </button>
      </div>
      
      {/* Modal Spotlight Command Center - Premium Light Mode */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-10 sm:pt-12 px-4 bg-slate-900/20 backdrop-blur-sm transition-all duration-300 animate-fadeIn overflow-y-auto">
          <div 
            ref={modalRef}
            onKeyDown={handleKeyDown}
            className="w-full max-w-5xl bg-white/95 backdrop-blur-2xl rounded-[1.5rem] shadow-[0_30px_100px_-20px_rgba(0,0,0,0.15)] border border-white overflow-hidden flex flex-col mb-10 text-slate-800"
          >
            {/* Input Header Premium Minimalist */}
            <div className="relative flex items-center bg-white border-b border-slate-100">
              <div className="absolute left-6 text-slate-400 pointer-events-none">
                <Search size={22} strokeWidth={2} />
              </div>
              <input
                ref={inputRef}
                type="text"
                placeholder="Busca empresas, fianzas, expedientes..."
                className="w-full bg-transparent border-0 pl-14 pr-20 py-5 text-xl font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-0"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute right-6 flex items-center space-x-3">
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-slate-400 hover:text-slate-600 p-1.5 transition-colors cursor-pointer bg-slate-50 hover:bg-slate-100 rounded-full"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                )}
                <kbd className="hidden sm:inline-flex px-2 py-1 text-[10px] font-black tracking-widest text-slate-400 uppercase bg-slate-50 border border-slate-200/80 rounded-md shadow-sm">
                  ESC
                </kbd>
              </div>
            </div>

            {/* Sleek Light Tabs */}
            <div className="px-5 sm:px-8 py-3 border-b border-slate-100/80 bg-slate-50/50 flex items-center gap-2 overflow-x-auto custom-scrollbar text-[13px]">
              <button
                onClick={() => { setSelectedFilter('todos'); setSelectedIndex(0); }}
                className={`transition-all whitespace-nowrap cursor-pointer px-4 py-1.5 rounded-full font-bold tracking-wide ${
                  selectedFilter === 'todos' 
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
                }`}
              >
                Todos
              </button>

              {!searchTerm && (
                <button
                  onClick={() => setSelectedFilter('obligaciones')}
                  className={`transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-full font-bold tracking-wide ${
                    selectedFilter === 'obligaciones' 
                      ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20' 
                      : 'bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 shadow-sm'
                  }`}
                >
                  <AlertTriangle size={14} strokeWidth={2.5} /> Alertas
                </button>
              )}

              {['empresas', 'fianzas', 'facturas', 'expedientes', 'cargos'].map(filter => {
                return (
                  <button
                    key={filter}
                    onClick={() => { setSelectedFilter(filter); setSelectedIndex(0); }}
                    className={`capitalize transition-all whitespace-nowrap cursor-pointer px-4 py-1.5 rounded-full font-bold tracking-wide ${
                      selectedFilter === filter 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                        : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 shadow-sm'
                    }`}
                  >
                    {filter}
                  </button>
                )
              })}
            </div>

            {/* Body Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 bg-slate-50/30 max-h-[60vh]">
              
              {!searchTerm && (
                <div className="space-y-8">
                  {/* ACCESOS RÁPIDOS */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                        <Sparkles size={12} className="text-blue-600" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800 tracking-tight">Accesos Rápidos</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {quickNavLinks.map((link) => {
                        const Icon = link.icon;
                        return (
                          <button
                            key={link.id}
                            onClick={() => { setIsOpen(false); if (onNavigate) onNavigate(link.view); }}
                            className="flex flex-col items-center justify-center gap-2 group cursor-pointer text-center p-4 bg-white border border-slate-200/80 rounded-xl shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300"
                          >
                            <div className="p-2.5 rounded-xl text-slate-600 bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors duration-300">
                              <Icon size={18} strokeWidth={2.5} />
                            </div>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 transition-colors">
                              {link.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* BÚSQUEDAS RECIENTES */}
                  {recentSearches.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                            <Clock size={12} className="text-slate-500" />
                          </div>
                          <h3 className="text-base font-bold text-slate-800 tracking-tight">Recientes</h3>
                        </div>
                        <button 
                          onClick={() => { setRecentSearches([]); localStorage.removeItem('mcqs_recent_searches'); }} 
                          className="text-[10px] font-bold text-slate-500 hover:text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 px-3 py-1 rounded-full transition-colors"
                        >
                          Limpiar Historial
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {recentSearches.map((search) => (
                          <div 
                            key={search.id} 
                            onClick={() => handleSelect(search.category, search.item)}
                            className="p-3 bg-white border border-slate-200/80 rounded-xl hover:shadow-sm hover:border-slate-300 transition-all duration-200 cursor-pointer group flex flex-col justify-between h-full"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <span className="text-[9px] font-black text-slate-400 group-hover:text-blue-500 transition-colors uppercase tracking-wider bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100">
                                {search.category}
                              </span>
                              <ArrowUpRight size={12} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                            </div>
                            <span className="text-xs font-bold text-slate-700 group-hover:text-slate-900 transition-colors line-clamp-2 leading-snug">
                              {search.category === 'empresas' ? search.item.nombre :
                               search.category === 'fianzas' ? `Fianza N° ${search.item.numero}` :
                               search.category === 'facturas' ? `Factura N° ${search.item.numero}` :
                               search.category === 'expedientes' ? `[${search.item.codigo}] ${search.item.nombre_proyecto}` :
                               search.category === 'cargos' ? `Cargo N° ${search.item.numero_cargo}` : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* BUSCANDO */}
              {searchTerm && (
                <div className="space-y-6">
                  {/* Opción Rápida Huánuco */}
                  <div
                    onClick={() => { setIsOpen(false); if (onNavigate) onNavigate('tramites-huanuco'); }}
                    className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 hover:border-blue-300 hover:shadow-md flex items-center justify-between cursor-pointer transition-all duration-300 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-600/20 group-hover:scale-110 transition-transform">
                        <Building2 size={20} strokeWidth={2} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-blue-900 group-hover:text-blue-700 transition-colors">
                          Consultar en Servidor GOREHCO
                        </p>
                        <p className="text-xs text-blue-700/70 font-medium mt-0.5">
                          Buscando <span className="font-mono font-bold">"{searchTerm}"</span> en Mesa de Partes
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-700 bg-white px-4 py-2 rounded-full shadow-sm border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      Buscar en vivo →
                    </span>
                  </div>

                  {isLoading ? (
                    <div className="py-20 flex justify-center text-blue-600">
                      <div className="w-8 h-8 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="py-20 text-center bg-white rounded-2xl border border-slate-100">
                      <p className="text-lg font-bold text-slate-700">No encontramos resultados para "{searchTerm}"</p>
                      <p className="text-sm text-slate-500 mt-2">Intenta con otra palabra clave o número de documento.</p>
                    </div>
                  ) : (
                    /* Layout 2 Columnas */
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      
                      {/* Lista de Resultados (Columna Izquierda 7 cols) */}
                      <div className="lg:col-span-7 space-y-2">
                        {filteredItems.map((itemObj, index) => {
                          const isSelected = selectedIndex === index;
                          const { category, data } = itemObj;

                          return (
                            <div
                              key={itemObj.key}
                              onMouseEnter={() => setSelectedIndex(index)}
                              onClick={() => handleSelect(category, data)}
                              className={`p-3.5 rounded-xl transition-all duration-200 cursor-pointer flex items-center justify-between group border ${
                                isSelected 
                                  ? 'bg-blue-50/50 border-blue-200 shadow-sm scale-[1.01] z-10 relative' 
                                  : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-slate-200 z-0'
                              }`}
                            >
                              <div className="flex items-center space-x-4 truncate">
                                <div className={`flex-shrink-0 p-2.5 rounded-xl transition-colors ${
                                  isSelected 
                                    ? `bg-white ${categoryColors[category]?.text || 'text-slate-800'} shadow-sm border border-slate-200` 
                                    : `${categoryColors[category]?.bg || 'bg-slate-50'} ${categoryColors[category]?.text || 'text-slate-500'} ${categoryColors[category]?.border || 'border-slate-100'} border group-hover:bg-white`
                                }`}>
                                  {category === 'empresas' ? <Building size={18} strokeWidth={2} /> :
                                   category === 'fianzas' ? <ShieldCheck size={18} strokeWidth={2} /> :
                                   category === 'facturas' ? <FileText size={18} strokeWidth={2} /> :
                                   category === 'expedientes' ? <FolderOpen size={18} strokeWidth={2} /> : <Package size={18} strokeWidth={2} />}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className={`text-sm font-bold line-clamp-2 leading-tight transition-colors ${
                                    isSelected ? 'text-blue-950' : 'text-slate-700 group-hover:text-slate-900'
                                  }`}>
                                    {category === 'empresas' ? data.nombre :
                                     category === 'fianzas' ? `Fianza N° ${data.numero}` :
                                     category === 'facturas' ? `Factura N° ${data.numero}` :
                                     category === 'expedientes' ? `[${data.codigo}] ${data.nombre_proyecto}` :
                                     category === 'cargos' ? `Cargo N° ${data.numero_cargo}` : ''}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1 ${
                                      isSelected ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                                    }`}>
                                      {category}
                                    </span>
                                    {data.empresa_nombre && (
                                      <span className="text-xs font-medium text-slate-500 truncate flex-1">
                                        • {data.empresa_nombre}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center space-x-4 flex-shrink-0 ml-2">
                                {data.monto && (
                                  <span className={`font-mono text-[13px] font-black ${isSelected ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-700'}`}>
                                    {data.moneda === 'USD' ? '$' : 'S/'} {parseFloat(data.monto || 0).toLocaleString('es-PE', { maximumFractionDigits: 0 })}
                                  </span>
                                )}
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                  isSelected ? 'bg-white border border-blue-100 text-blue-600 shadow-sm' : 'bg-transparent text-transparent group-hover:text-slate-400'
                                }`}>
                                  <ArrowRight size={14} strokeWidth={3} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Panel Inspector Lateral Inteligente (Columna Derecha 5 cols) */}
                      <div className="hidden lg:block lg:col-span-5 relative pl-2">
                        {activeItem ? (
                          <div className="sticky top-0 bg-white border border-slate-200/80 rounded-[1.5rem] p-6 shadow-xl shadow-slate-200/40 flex flex-col animate-fadeIn relative overflow-hidden h-max">
                            {/* Decorative dynamic top gradient */}
                            <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${categoryColors[activeItem.category]?.gradient || 'from-slate-400 to-slate-500'}`}></div>
                            
                            <div className="flex-1 space-y-5 relative z-10">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md ${categoryColors[activeItem.category]?.bg} ${categoryColors[activeItem.category]?.text} ${categoryColors[activeItem.category]?.border} border inline-flex items-center gap-1.5 mb-3`}>
                                    {activeItem.category === 'empresas' ? <Building size={12} strokeWidth={2.5}/> :
                                     activeItem.category === 'fianzas' ? <ShieldCheck size={12} strokeWidth={2.5}/> :
                                     activeItem.category === 'facturas' ? <FileText size={12} strokeWidth={2.5}/> :
                                     activeItem.category === 'expedientes' ? <FolderOpen size={12} strokeWidth={2.5}/> : <Package size={12} strokeWidth={2.5}/>}
                                    {activeItem.category}
                                  </span>
                                  <h4 className="text-xl font-bold text-slate-800 leading-tight">
                                    {activeItem.category === 'empresas' ? activeItem.data.nombre :
                                     activeItem.category === 'fianzas' ? `Fianza N° ${activeItem.data.numero}` :
                                     activeItem.category === 'facturas' ? `Factura N° ${activeItem.data.numero}` :
                                     activeItem.category === 'expedientes' ? activeItem.data.nombre_proyecto :
                                     activeItem.category === 'cargos' ? `Cargo N° ${activeItem.data.numero_cargo}` : ''}
                                  </h4>
                                  
                                  {activeItem.data.codigo && (
                                    <div 
                                      className="inline-flex mt-3 items-center gap-2 font-mono font-bold text-[11px] bg-slate-50 hover:bg-slate-100 text-slate-700 px-2 py-1 rounded border border-slate-200 cursor-pointer transition-colors"
                                      onClick={(e) => handleCopyAction(activeItem.data.codigo, e)}
                                      title="Copiar Código"
                                    >
                                      {activeItem.data.codigo}
                                      {copiedText === activeItem.data.codigo ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} className="text-slate-400" />}
                                    </div>
                                  )}
                                </div>
                                
                                {/* Status Badge Dinámico para Fianzas/Facturas */}
                                {activeItem.data.fecha_vencimiento && getEstadoBadge(activeItem.data.fecha_vencimiento) && (
                                  <div className={`px-2 py-1 rounded border text-[10px] font-black uppercase tracking-wider flex items-center gap-1 ${getEstadoBadge(activeItem.data.fecha_vencimiento).color}`}>
                                    {React.createElement(getEstadoBadge(activeItem.data.fecha_vencimiento).icon, { size: 12, strokeWidth: 2.5 })}
                                    {getEstadoBadge(activeItem.data.fecha_vencimiento).label}
                                  </div>
                                )}
                              </div>

                              {/* Metadatos */}
                              <div className="flex flex-col gap-3 py-2 border-y border-slate-100 text-[13px]">
                                {activeItem.data.empresa_nombre && (
                                  <div className="flex justify-between items-start">
                                    <span className="font-bold text-slate-400 mt-0.5">Empresa</span>
                                    <span className="font-bold text-slate-700 text-right max-w-[70%] line-clamp-2 leading-tight">{activeItem.data.empresa_nombre}</span>
                                  </div>
                                )}
                                {activeItem.data.ruc && (
                                  <div className="flex justify-between items-center group/ruc cursor-pointer" onClick={(e) => handleCopyAction(activeItem.data.ruc, e)} title="Copiar RUC">
                                    <span className="font-bold text-slate-400 flex items-center gap-1">RUC <Copy size={10} className="opacity-0 group-hover/ruc:opacity-100 text-blue-500 transition-opacity" /></span>
                                    <span className="font-mono font-bold text-slate-600 flex items-center gap-2">
                                      {copiedText === activeItem.data.ruc && <span className="text-[9px] text-emerald-500 bg-emerald-50 px-1 rounded">Copiado</span>}
                                      {activeItem.data.ruc}
                                    </span>
                                  </div>
                                )}
                                {activeItem.data.monto && (
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="font-bold text-slate-400">Monto</span>
                                    <span className="font-mono text-base font-black text-slate-800">
                                      {activeItem.data.moneda === 'USD' ? <span className="text-emerald-600 mr-1">USD $</span> : <span className="text-blue-600 mr-1">PEN S/</span>} 
                                      {parseFloat(activeItem.data.monto).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                                {activeItem.data.tipo && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-400">Tipo</span>
                                    <span className="font-bold text-slate-700 capitalize bg-slate-50 px-2 py-0.5 rounded border border-slate-100">{activeItem.data.tipo.replace(/_/g, ' ')}</span>
                                  </div>
                                )}
                                {activeItem.data.fecha_vencimiento && (
                                  <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-400">Vencimiento</span>
                                    <span className="font-mono font-bold text-slate-600 flex items-center gap-1.5">
                                      <CalendarDays size={12} className="text-slate-400"/>
                                      {new Date(activeItem.data.fecha_vencimiento).toLocaleDateString('es-PE')}
                                    </span>
                                  </div>
                                )}
                                {activeItem.data.destinatario && (
                                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-100/50">
                                    <span className="font-bold text-slate-400">Destinatario</span>
                                    <span className="font-medium text-slate-700 line-clamp-2 leading-snug bg-slate-50/50 p-2 rounded-lg border border-slate-100">{activeItem.data.destinatario}</span>
                                  </div>
                                )}
                                {activeItem.data.asunto && (
                                  <div className="flex flex-col gap-1 pt-2 border-t border-slate-100/50">
                                    <span className="font-bold text-slate-400">Asunto</span>
                                    <p className="font-medium text-slate-700 line-clamp-3 leading-snug">{activeItem.data.asunto}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Acciones Rápidas */}
                            <div className="grid grid-cols-3 gap-2 mt-4 relative z-10">
                              <button 
                                onClick={(e) => handleCopyAction(JSON.stringify(activeItem.data), e)}
                                className={`flex flex-col items-center justify-center gap-1 py-2 rounded-xl border border-slate-100 text-slate-500 font-bold text-[10px] hover:text-slate-800 transition-colors ${copiedText ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-slate-50 hover:bg-slate-100'}`}
                              >
                                {copiedText ? <Check size={14} /> : <Copy size={14} />}
                                {copiedText ? 'COPIADO' : 'COPIAR DATOS'}
                              </button>
                              <button className="flex flex-col items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 py-2 rounded-xl border border-slate-100 text-slate-500 font-bold text-[10px] hover:text-slate-800 transition-colors">
                                <Printer size={14} /> IMPRIMIR
                              </button>
                              <button className="flex flex-col items-center justify-center gap-1 bg-slate-50 hover:bg-slate-100 py-2 rounded-xl border border-slate-100 text-slate-500 font-bold text-[10px] hover:text-slate-800 transition-colors">
                                <Share2 size={14} /> COMPARTIR
                              </button>
                            </div>

                            <div className="mt-3 relative z-10">
                              <button
                                onClick={() => handleSelect(activeItem.category, activeItem.data)}
                                className={`w-full text-white py-3 px-4 rounded-xl font-bold flex items-center justify-center space-x-2 transition-all duration-300 shadow-md group/btn bg-gradient-to-r ${categoryColors[activeItem.category]?.gradient || 'from-slate-600 to-slate-700'} hover:shadow-lg`}
                              >
                                <span className="text-xs uppercase tracking-wider font-black">ABRIR REGISTRO COMPLETO</span>
                                <ExternalLink size={14} strokeWidth={2.5} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-0.5 transition-transform" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="h-64 bg-slate-50/50 border border-slate-200/60 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center sticky top-0">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-100 flex items-center justify-center mb-4">
                              <Command size={20} className="text-slate-300" />
                            </div>
                            <h4 className="text-base font-bold text-slate-700 mb-1">Inspector</h4>
                            <p className="text-xs text-slate-500 font-medium">Navega para ver detalles rápidos.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer Legend Premium */}
            <div className="bg-white/80 backdrop-blur-md px-8 py-4 border-t border-slate-100 flex justify-between items-center">
              <div className="flex items-center space-x-8">
                <span className="flex items-center space-x-3 text-slate-500 cursor-default">
                  <span className="flex gap-1">
                    <kbd className="px-2 py-1 bg-slate-50 border border-slate-200 rounded shadow-sm font-mono text-[10px] font-black">↑</kbd>
                    <kbd className="px-2 py-1 bg-slate-50 border border-slate-200 rounded shadow-sm font-mono text-[10px] font-black">↓</kbd>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Navegar</span>
                </span>
                <span className="flex items-center space-x-3 text-slate-500 cursor-default">
                  <kbd className="px-3 py-1 bg-slate-50 border border-slate-200 rounded shadow-sm font-mono text-[10px] font-black">↵</kbd>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Abrir</span>
                </span>
                <span className="flex items-center space-x-3 text-slate-500 cursor-default">
                  <kbd className="px-2 py-1 bg-slate-50 border border-slate-200 rounded shadow-sm font-mono text-[10px] font-black">ESC</kbd>
                  <span className="text-[10px] font-bold uppercase tracking-widest">Cerrar</span>
                </span>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-blue-600/70">
                <Sparkles size={12} className="text-blue-500" /> MCQS Premium
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default GlobalSearch;
