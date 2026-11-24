import React from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** Botón o acción principal de la página (se alinea a la derecha en pantallas grandes) */
  action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 border border-slate-800 p-6 rounded-2xl shrink-0">
    <div>
      <h2 className="text-xl font-bold text-white">{title}</h2>
      {description && <p className="text-sm text-slate-400">{description}</p>}
    </div>
    {action}
  </div>
);
