import React from 'react';
import { getFlagEmoji, getCountryName, FLAG_SIZES } from '../utils/flags';

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
  const flagEmoji = getFlagEmoji(countryCode);

  const flagElement = (
    <span
      className={`inline-block ${onClick ? 'cursor-pointer hover:opacity-80' : ''} ${className}`}
      style={{ 
        fontSize: `${size}px`,
        lineHeight: 1
      }}
      onClick={onClick}
      title={showTooltip ? countryName : undefined}
    >
      {flagEmoji}
    </span>
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
