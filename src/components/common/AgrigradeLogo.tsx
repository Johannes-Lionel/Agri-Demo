import React from 'react';

interface AgrigradeLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  showEmblem?: boolean;
}

export const AgrigradeLogo: React.FC<AgrigradeLogoProps> = ({ 
  size = 'md',
  showEmblem = false 
}) => {
  const logoHeights = {
    sm: 'h-7',
    md: 'h-8',
    lg: 'h-11',
    hero: 'h-16',
  };

  const emblemSizes = {
    sm: 'w-7 h-7',
    md: 'w-8 h-8',
    lg: 'w-11 h-11',
    hero: 'w-16 h-16',
  };

  return (
    <div className="inline-flex items-center gap-2 select-none">
      {showEmblem && (
        <div className={`${emblemSizes[size]} rounded-full overflow-hidden shadow-sm shrink-0 border border-[#23492C]/20 bg-[#164426] flex items-center justify-center`}>
          <img
            src="/icon.svg"
            alt="Agrigrade Emblem"
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* The official name logo uploaded by user with the leaf dot on 'i' */}
      <img
        src="/top-logo.svg"
        alt="Agrigrade"
        className={`${logoHeights[size]} w-auto object-contain`}
      />
    </div>
  );
};
