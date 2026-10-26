import React from 'react';
import NAGULAN_BANNER_BASE64 from '../assets/bannerBase64';

export const NagulanBanner = ({
  customUrl = '',
  compact = false,
  printable = false,
  className = '',
}) => {
  const bannerSrc = (customUrl && customUrl.startsWith('http')) ? customUrl : NAGULAN_BANNER_BASE64;

  if (printable) {
    return (
      <div className={`w-full bg-black overflow-hidden m-0 p-0 border-none ${className}`}>
        <img
          src={bannerSrc}
          onError={(e) => {
            e.currentTarget.src = NAGULAN_BANNER_BASE64;
          }}
          alt="NAGULAN Unisex Salon Banner"
          className="w-full h-auto object-cover block border-none m-0 p-0"
          style={{ width: '100%', display: 'block' }}
        />
      </div>
    );
  }

  return (
    <div
      className={`w-full flex items-center justify-center overflow-hidden rounded-xl bg-black border border-gray-800 shadow-md ${
        compact ? 'p-0.5' : 'p-1'
      } ${className}`}
    >
      <img
        src={bannerSrc}
        onError={(e) => {
          e.currentTarget.src = NAGULAN_BANNER_BASE64;
        }}
        alt="NAGULAN Unisex Salon Banner"
        className="w-full h-auto object-cover rounded-lg max-h-36 sm:max-h-44"
        style={{ width: '100%', display: 'block' }}
      />
    </div>
  );
};

export default NagulanBanner;
