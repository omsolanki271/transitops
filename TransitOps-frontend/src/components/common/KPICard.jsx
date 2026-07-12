import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export const KPICard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendValue, 
  trendLabel, 
  variant = 'white' 
}) => {
  const isMint = variant === 'mint';

  return (
    <div 
      className={`relative select-none rounded-xl p-5 border transition-all duration-200 card-hover-effect cursor-default ${
        isMint 
          ? 'bg-mint-card border-white/20 text-dark-gray shadow-[0_10px_30px_rgba(0,0,0,0.04)]' 
          : 'bg-white border-gray-100 text-on-surface shadow-sm'
      }`}
    >
      <div className="flex justify-between items-start">
        <div>
          {/* Card Title */}
          <p className={`text-xs font-bold uppercase tracking-wider ${
            isMint ? 'text-dark-gray/70' : 'text-on-surface-variant'
          }`}>
            {title}
          </p>
          {/* Card Value */}
          <h3 className="text-2xl font-bold mt-2 leading-none">
            {value}
          </h3>
        </div>

        {/* Card Icon */}
        {Icon && (
          <div className={`p-2.5 rounded-xl ${
            isMint ? 'bg-dark-gray/10 text-dark-gray' : 'bg-primary/10 text-primary'
          }`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>

      {/* Trend Info (optional) */}
      {(trend || trendValue) && (
        <div className="mt-4 flex items-center gap-1.5 text-xs">
          {trend === 'up' && (
            <span className={`inline-flex items-center font-bold ${isMint ? 'text-green-800' : 'text-green-600'}`}>
              <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
              {trendValue}
            </span>
          )}
          {trend === 'down' && (
            <span className={`inline-flex items-center font-bold ${isMint ? 'text-red-800' : 'text-red-600'}`}>
              <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
              {trendValue}
            </span>
          )}
          <span className={isMint ? 'text-dark-gray/60 font-medium' : 'text-on-surface-variant font-medium'}>
            {trendLabel}
          </span>
        </div>
      )}
    </div>
  );
};

export default KPICard;
