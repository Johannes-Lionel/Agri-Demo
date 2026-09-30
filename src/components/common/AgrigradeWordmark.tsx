import React from 'react';

interface AgrigradeWordmarkProps {
  height?: number;
  className?: string;
}

export const AgrigradeWordmark: React.FC<AgrigradeWordmarkProps> = ({ 
  height = 28,
  className = ''
}) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <img
        src="/agrigrade-wordmark.svg"
        alt="Agrigrade"
        style={{ height: `${height}px` }}
        className="w-auto object-contain select-none"
      />
    </div>
  );
};
