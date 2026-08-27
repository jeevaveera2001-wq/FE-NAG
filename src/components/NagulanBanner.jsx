import React from 'react';
import NAGULAN_BANNER_BASE64 from '../assets/bannerBase64';

export const NagulanBanner = ({
  customUrl = '',
  compact = false,
  printable = false,
  className = '',
}) => {
  const bannerSrc = (customUrl && customUrl.startsWith('http')) ? customUrl : NAGULAN_BANNER_BASE64;

  return (
    <div
      className={`w-full flex items-center justify-center overflow-hidden rounded-xl bg-black border border-charcoal-800 shadow-md ${
        compact ? 'p-1' : printable ? 'p-0' : 'p-1 sm:p-2'
      } ${className}`}
    >
      <img
        src={bannerSrc}
        onError={(e) => {
          e.currentTarget.src = NAGULAN_BANNER_BASE64;
        }}
        alt="NAGULAN Unisex Salon Banner"
        className="w-full h-auto object-contain rounded-lg max-h-36 sm:max-h-44"
        style={{ width: '100%', display: 'block' }}
      />
    </div>
  );
};

export default NagulanBanner;
