import React, { useState } from 'react';
import { getFlagUrl, getCountryName, FLAG_SIZES } from '../utils/flags';

const CountryFlag = ({ 
  countryCode, 
  size = FLAG_SIZES.MEDIUM, 
  showName = false, 
  showTooltip = true,
  className = "",
  onClick = null,
  fallbackToUS = true
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const countryName = getCountryName(countryCode);
  const flagUrl = getFlagUrl(countryCode, size);
  const fallbackUrl = fallbackToUS ? getFlagUrl('US', size) : null;

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = (e) => {
    setImageError(true);
    setImageLoaded(false);
    
    if (fallbackToUS && fallbackUrl && e.target.src !== fallbackUrl) {
      // Try fallback only once to prevent infinite loops
      e.target.src = fallbackUrl;
    } else {
      // Hide broken image after fallback attempt
      e.target.style.display = 'none';
    }
  };

  const flagElement = (
    <img
      src={flagUrl}
      alt={`${countryName} flag`}
      className={`rounded ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className} ${
        !imageLoaded ? 'opacity-0' : 'opacity-100'
      } transition-opacity duration-200`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        objectFit: 'cover'
      }}
      onLoad={handleImageLoad}
      onError={handleImageError}
      onClick={onClick}
      title={showTooltip ? countryName : undefined}
      loading="lazy" // Add lazy loading to reduce initial network requests
    />
  );

  if (showName) {
    return (
      <div className="flex items-center space-x-2">
        {flagElement}
        <span className="text-white text-sm">{countryName}</span>
      </div>
    );
  }

  return flagElement;
};

export default CountryFlag;
