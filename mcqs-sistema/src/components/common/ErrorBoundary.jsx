import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full p-8 my-8 bg-white border border-rose-200 rounded-[32px] shadow-xl text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-rose-100 text-rose-600 flex items-center justify-center font-bold text-2xl">
            ⚠️
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase">Ha ocurrido un error en este componente</h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto">
            {this.state.error?.message || 'Error inesperado al renderizar la vista.'}
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="px-6 py-2.5 bg-slate-950 hover:bg-slate-900 text-white font-black text-xs uppercase tracking-wider rounded-2xl transition-all shadow-md cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
