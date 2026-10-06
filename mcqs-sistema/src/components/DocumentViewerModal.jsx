import React from 'react';

const DocumentViewerModal = ({ isOpen, onClose, fileUrl, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 backdrop-blur-xs p-4 sm:p-6 transition-all">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-[32px] shadow-2xl flex flex-col overflow-hidden border border-slate-200/80 ring-1 ring-slate-200/60 animate-fadeIn text-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between px-7 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center space-x-3.5">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-200 shadow-xs">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
              </svg>
            </div>
            <h3 className="text-base font-black text-slate-950 uppercase tracking-wider">{title || 'Visor de Documento'}</h3>
          </div>
          <div className="flex items-center space-x-2">
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="p-2.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-2xl transition-colors border border-slate-200 shadow-xs bg-white"
              title="Abrir en nueva pestaña"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 0 0 3 8.25v10.5A2.25 2.25 0 0 0 5.25 21h10.5A2.25 2.25 0 0 0 18 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
              </svg>
            </a>
            <button
              onClick={onClose}
              className="p-2.5 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-colors font-bold border border-slate-200 shadow-xs bg-white cursor-pointer"
              title="Cerrar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 w-full bg-slate-100/50 p-2 sm:p-4">
          <iframe 
            src={fileUrl} 
            className="w-full h-full rounded-2xl border border-slate-200 bg-white shadow-inner"
            title={title}
          />
        </div>
      </div>
    </div>
  );
};

export default DocumentViewerModal;
