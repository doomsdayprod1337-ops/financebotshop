import React from 'react';
import CountryFlag from './CountryFlag';
import { getCountryName, getCountryRegion, FLAG_SIZES } from '../utils/flags';

const BotCard = ({ 
  bot, 
  onPurchase, 
  onViewDetails,
  showCountryInfo = true,
  flagSize = FLAG_SIZES.MEDIUM,
  className = ""
}) => {
  const {
    id,
    name,
    description,
    price,
    country_code,
    status = 'available',
    category,
    rating,
    downloads,
    created_at
  } = bot;

  const countryName = getCountryName(country_code);
  const countryRegion = getCountryRegion(country_code);

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'bg-green-900 text-green-100';
      case 'maintenance':
        return 'bg-yellow-900 text-yellow-100';
      case 'unavailable':
        return 'bg-red-900 text-red-100';
      case 'beta':
        return 'bg-blue-900 text-blue-100';
      default:
        return 'bg-gray-900 text-gray-100';
    }
  };

  const getStatusText = (status) => {
    switch (status.toLowerCase()) {
      case 'available':
        return 'Available';
      case 'maintenance':
        return 'Maintenance';
      case 'unavailable':
        return 'Unavailable';
      case 'beta':
        return 'Beta';
      default:
        return status;
    }
  };

  return (
    <div className={`bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-gray-600 transition-all duration-200 ${className}`}>
      {/* Header with Flag and Name */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-3">
            {showCountryInfo && country_code && (
              <div className="flex-shrink-0">
                <CountryFlag 
                  countryCode={country_code} 
                  size={flagSize}
                  showTooltip={true}
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-white truncate">{name}</h3>
              {showCountryInfo && country_code && (
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-sm text-gray-400">{countryName}</span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-gray-500">{countryRegion}</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end space-y-2">
            <span className={`inline-block px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
              {getStatusText(status)}
            </span>
            {category && (
              <span className="text-xs text-gray-400 bg-gray-700 px-2 py-1 rounded">
                {category}
              </span>
            )}
          </div>
        </div>
        
        {/* Description */}
        <p className="text-gray-300 text-sm line-clamp-2">{description}</p>
      </div>

      {/* Stats and Rating */}
      <div className="px-4 py-3 bg-gray-750 border-b border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            {rating !== undefined && (
              <div className="flex items-center space-x-1">
                <span className="text-yellow-400">★</span>
                <span className="text-gray-300">{rating.toFixed(1)}</span>
              </div>
            )}
            {downloads !== undefined && (
              <div className="flex items-center space-x-1">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                <span className="text-gray-300">{downloads.toLocaleString()}</span>
              </div>
            )}
          </div>
          {created_at && (
            <span className="text-xs text-gray-500">
              {new Date(created_at).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>

      {/* Footer with Price and Actions */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-green-400">
              ${typeof price === 'number' ? price.toFixed(2) : price}
            </span>
            {country_code && (
              <div className="flex items-center space-x-1 text-xs text-gray-400">
                <span>•</span>
                <CountryFlag 
                  countryCode={country_code} 
                  size={FLAG_SIZES.SMALL}
                  showTooltip={false}
                />
                <span>{country_code.toUpperCase()}</span>
              </div>
            )}
          </div>
          
          <div className="flex space-x-2">
            {onViewDetails && (
              <button
                onClick={() => onViewDetails(bot)}
                className="px-3 py-2 text-sm bg-gray-600 text-white rounded hover:bg-gray-500 transition-colors"
              >
                Details
              </button>
            )}
            {onPurchase && status === 'available' && (
              <button
                onClick={() => onPurchase(bot)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
              >
                Purchase
              </button>
            )}
            {status !== 'available' && (
              <button
                disabled
                className="px-4 py-2 bg-gray-600 text-gray-400 rounded cursor-not-allowed font-medium"
              >
                {status === 'maintenance' ? 'In Maintenance' : 'Unavailable'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BotCard;
