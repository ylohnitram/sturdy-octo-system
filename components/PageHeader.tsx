import React from 'react';

interface PageHeaderProps {
    title: string;
    highlight?: string; // The part to be colored/gradient
    subtitle?: string;
    icon?: React.ReactNode;
    action?: React.ReactNode;
    variant?: 'red' | 'gold'; // To switch between red/orange and yellow/gold themes
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, highlight, subtitle, icon, action, variant = 'red' }) => {
    const gradientClass = variant === 'red'
        ? 'from-red-500 to-orange-600'
        : 'from-yellow-400 to-orange-500';

    const iconBgClass = variant === 'red'
        ? 'bg-red-500/10 text-red-500 border-red-500/20'
        : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';

    const shadowClass = variant === 'red' ? 'shadow-red-900/20' : 'shadow-orange-900/20';

    return (
        <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                {icon && (
                    <div className={`p-3 rounded-2xl border ${iconBgClass} shadow-lg ${shadowClass}`}>
                        {icon}
                    </div>
                )}
                <div>
                    {/* Added pr-2 to span to fix italic text clipping with bg-clip-text */}
                    <h1 className="text-2xl font-black uppercase tracking-tight italic text-white leading-none py-1">
                        {title} <span className={`text-transparent bg-clip-text bg-gradient-to-r ${gradientClass} pr-2`}>{highlight}</span>
                    </h1>
                    {subtitle && (
                        <p className="text-xs text-slate-400 font-medium mt-1 ml-0.5">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {action && (
                <div>
                    {action}
                </div>
            )}
        </div>
    );
};
