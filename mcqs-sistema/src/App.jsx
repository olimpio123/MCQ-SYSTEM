import { useState, useEffect } from 'react'
import Login from './components/Login'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import Expedientes from './components/expedientes/Expedientes'
import ExpedienteDetalle from './components/expedientes/ExpedienteDetalle'
import CarpetaArchivos from './components/expedientes/CarpetaArchivos'
import CartaFianzas from './components/cartas-fianzas/CartaFianzas'
import FianzasEmpresa from './components/cartas-fianzas/FianzasEmpresa'
import Facturas from './components/facturas/Facturas'
import FacturasEmpresa from './components/facturas/FacturasEmpresa'
import Cargos from './components/cargos/Cargos'
import CargosDetalle from './components/cargos/CargosDetalle'
import Informes from './components/informes/Informes'
import Renovaciones from './components/cartas-fianzas/Renovaciones'
import TramitesHuanuco from './components/layout/TramitesHuanuco'
import ConsultaDocumentos from './components/consultas/ConsultaDocumentos'
import GlobalSearch from './components/layout/GlobalSearch'
import ErrorBoundary from './components/common/ErrorBoundary'
import { Toaster } from 'react-hot-toast'
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('isAuthenticated') === 'true' && Boolean(localStorage.getItem('token'));
  })
  const [currentView, setCurrentView] = useState(() => {
    const hash = window.location.hash.slice(1);
    const validViews = ['dashboard', 'expedientes', 'cartas-fianzas', 'renovaciones', 'facturas', 'cargos', 'informes', 'tramites-huanuco', 'consultas-dni-ruc', 'ajustes'];
    return validViews.includes(hash) ? hash : 'dashboard';
  })
  const [activeExpediente, setActiveExpediente] = useState(null)
  const [activeCarpeta, setActiveCarpeta] = useState(null)
  const [activeEmpresaFianza, setActiveEmpresaFianza] = useState(null)
  const [activeEmpresaFactura, setActiveEmpresaFactura] = useState(null)
  const [activeCargoCategoria, setActiveCargoCategoria] = useState(null)

  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validViews = ['dashboard', 'expedientes', 'cartas-fianzas', 'renovaciones', 'facturas', 'cargos', 'informes', 'tramites-huanuco', 'consultas-dni-ruc', 'ajustes'];
      if (validViews.includes(hash)) {
        setCurrentView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (isAuthenticated && currentView) {
      window.location.hash = currentView;
    } else {
      window.location.hash = '';
    }
  }, [currentView, isAuthenticated]);

  const handleLogin = (token, user) => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
    if (token) localStorage.setItem('token', token);
    if (user) localStorage.setItem('user', JSON.stringify(user));
  }
  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.hash = '';
    setCurrentView('dashboard')
    setActiveExpediente(null)
    setActiveCarpeta(null)
    setActiveEmpresaFianza(null)
    setActiveEmpresaFactura(null)
    setActiveCargoCategoria(null)
  }

  const handleViewChange = (view) => {
    setCurrentView(view)
    if (view === 'dashboard' || view === 'expedientes' || view === 'cartas-fianzas' || view === 'facturas' || view === 'cargos' || view === 'informes' || view === 'tramites-huanuco') {
      setActiveExpediente(null)
      setActiveCarpeta(null)
      setActiveEmpresaFianza(null)
      setActiveEmpresaFactura(null)
      setActiveCargoCategoria(null)
    }
    if (view === 'expediente-detalle') {
      setActiveCarpeta(null)
    }
  }

  const handleOpenExpediente = (expediente) => {
    setActiveExpediente(expediente)
    setCurrentView('expediente-detalle')
  }

  const handleOpenCarpeta = (carpeta) => {
    setActiveCarpeta(carpeta)
    setCurrentView('carpeta-archivos')
  }

  const handleOpenEmpresaFianza = (empresa) => {
    setActiveEmpresaFianza(empresa)
    setCurrentView('fianzas-empresa')
  }

  const handleOpenEmpresaFactura = (empresa) => {
    setActiveEmpresaFactura(empresa)
    setCurrentView('facturas-empresa')
  }

  const handleOpenCargo = (categoria) => {
    setActiveCargoCategoria(categoria)
    setCurrentView('cargos-detalle')
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />
  }

  return (
    <Layout 
      onLogout={handleLogout} 
      currentView={(currentView === 'expediente-detalle' || currentView === 'carpeta-archivos') ? 'expedientes' : (currentView === 'fianzas-empresa' ? 'cartas-fianzas' : (currentView === 'facturas-empresa' ? 'facturas' : (currentView === 'cargos-detalle' ? 'cargos' : currentView)))} 
      setCurrentView={handleViewChange}
    >
      <Toaster 
        position="top-center" 
        toastOptions={{ 
          className: '!bg-white !text-slate-900 !border !border-slate-200 !shadow-2xl text-sm font-bold px-5 py-3.5 rounded-2xl min-w-[320px] mt-4 ring-1 ring-slate-900/5',
          duration: 4000
        }} 
      />
      <ErrorBoundary key={currentView}>
        {currentView === 'dashboard' && (
          <Dashboard 
            onNavigate={handleViewChange} 
            onOpenEmpresaFianza={handleOpenEmpresaFianza} 
          />
        )}
        {currentView === 'expedientes' && <Expedientes onOpenExpediente={handleOpenExpediente} />}
        {currentView === 'cartas-fianzas' && <CartaFianzas onOpenEmpresa={handleOpenEmpresaFianza} />}
        {currentView === 'fianzas-empresa' && (
          <FianzasEmpresa 
            empresa={activeEmpresaFianza} 
            onBack={() => handleViewChange('cartas-fianzas')} 
          />
        )}
        {currentView === 'facturas' && <Facturas onOpenEmpresa={handleOpenEmpresaFactura} />}
        {currentView === 'facturas-empresa' && (
          <FacturasEmpresa 
            empresa={activeEmpresaFactura} 
            onBack={() => handleViewChange('facturas')} 
          />
        )}
        {currentView === 'cargos' && <Cargos onOpenCargo={handleOpenCargo} />}
        {currentView === 'cargos-detalle' && (
          <CargosDetalle 
            categoria={activeCargoCategoria} 
            onBack={() => handleViewChange('cargos')} 
          />
        )}
        {currentView === 'expediente-detalle' && (
          <ExpedienteDetalle 
            expediente={activeExpediente} 
            onBack={() => handleViewChange('expedientes')} 
            onOpenCarpeta={handleOpenCarpeta}
          />
        )}
        {currentView === 'carpeta-archivos' && (
          <CarpetaArchivos 
            expediente={activeExpediente} 
            carpeta={activeCarpeta}
            onBack={() => handleViewChange('expediente-detalle')} 
          />
        )}
        {currentView === 'informes' && <Informes />}
        {currentView === 'renovaciones' && <Renovaciones />}
        {currentView === 'tramites-huanuco' && <TramitesHuanuco />}
        {currentView === 'consultas-dni-ruc' && <ConsultaDocumentos />}
      </ErrorBoundary>
      <GlobalSearch 
        onNavigate={handleViewChange} 
        onOpenEmpresaFianza={handleOpenEmpresaFianza}
        onOpenEmpresaFactura={handleOpenEmpresaFactura}
        onOpenExpediente={handleOpenExpediente}
        onOpenCargo={handleOpenCargo}
      />
    </Layout>
  )
}
    export default App
