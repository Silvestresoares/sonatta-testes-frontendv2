import React from 'react';

export default function Skeleton({ className = '', variant = 'rectangular' }) {
  // variants: 'text', 'circular', 'rectangular'
  let baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-800 rounded';

  if (variant === 'circular') {
    baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-800 rounded-full';
  } else if (variant === 'text') {
    baseClasses = 'animate-pulse bg-gray-200 dark:bg-gray-800 rounded h-4 w-3/4';
  }

  return <div className={`${baseClasses} ${className}`}></div>;
}

// Utilitário para o Kanban
export function KanbanSkeleton() {
  return (
    <div className="flex gap-6 overflow-x-auto pb-4 pt-2">
      {[1, 2, 3, 4, 5].map((col) => (
        <div key={col} className="w-80 min-w-[320px] shrink-0 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
          <Skeleton className="h-6 w-1/2 mb-4" />
          <div className="space-y-3">
            {[1, 2, 3].map((card) => (
              <div key={card} className="p-4 rounded-lg border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <Skeleton className="h-5 w-3/4 mb-3" />
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-5/6" />
                <div className="mt-4 pt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700">
                   <Skeleton variant="circular" className="h-8 w-8" />
                   <Skeleton className="h-4 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Utilitário para Tabelas Genéricas (Alunos, Professores, Financeiro)
export function TableSkeleton() {
  return (
    <div className="w-full">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="p-4"><Skeleton className="h-4 w-24" /></th>
                <th className="p-4"><Skeleton className="h-4 w-32" /></th>
                <th className="p-4"><Skeleton className="h-4 w-20" /></th>
                <th className="p-4"><Skeleton className="h-4 w-24" /></th>
                <th className="p-4"><Skeleton className="h-4 w-16" /></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {[1, 2, 3, 4, 5, 6].map((row) => (
                <tr key={row}>
                  <td className="p-4"><Skeleton className="h-4 w-32" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-40" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-24" /></td>
                  <td className="p-4"><Skeleton className="h-4 w-20" /></td>
                  <td className="p-4">
                    <div className="flex gap-2">
                       <Skeleton variant="circular" className="h-8 w-8" />
                       <Skeleton variant="circular" className="h-8 w-8" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
