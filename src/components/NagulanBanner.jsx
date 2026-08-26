import React from 'react';
import nagulanBannerImg from '../assets/nagulan-banner.jpg';

export const NagulanBanner = ({
  customUrl = '',
  compact = false,
  printable = false,
  className = '',
}) => {
  const bannerSrc = customUrl || nagulanBannerImg || '/nagulan-banner.jpg';

  return (
    <div
      className={`w-full flex items-center justify-center overflow-hidden rounded-xl bg-black border border-charcoal-800 shadow-md ${
        compact ? 'p-1' : printable ? 'p-0' : 'p-1 sm:p-2'
      } ${className}`}
    >
      <img
        src={bannerSrc}
        alt="NAGULAN Unisex Salon Banner"
        className="w-full h-auto object-contain rounded-lg max-h-36 sm:max-h-44"
        style={{ aspectRatio: '800/220', width: '100%' }}
      />
    </div>
  );
};

export default NagulanBanner;
