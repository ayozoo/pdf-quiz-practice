import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  icon?: LucideIcon;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}

export function PageHeader({ icon: Icon, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
      <div className="space-y-1.5">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
              <Icon size={22} strokeWidth={2} />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 m-0 tracking-tight">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 dark:text-gray-400 m-0 max-w-2xl leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
