import React from 'react';
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
  const countryName = getCountryName(countryCode);
  const flagUrl = getFlagUrl(countryCode, size);
  const fallbackUrl = fallbackToUS ? getFlagUrl('US', size) : null;

  const handleImageError = (e) => {
    if (fallbackToUS && fallbackUrl) {
      e.target.src = fallbackUrl;
    } else {
      // Hide broken image
      e.target.style.display = 'none';
    }
  };

  const flagElement = (
    <img
      src={flagUrl}
      alt={`${countryName} flag`}
      className={`rounded ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      style={{ 
        width: `${size}px`, 
        height: `${size}px`,
        objectFit: 'cover'
      }}
      onError={handleImageError}
      onClick={onClick}
      title={showTooltip ? countryName : undefined}
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
