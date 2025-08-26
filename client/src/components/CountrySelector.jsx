import React, { useState, useMemo } from 'react';
import { 
  countryFlags, 
  getFlagUrl, 
  getCountriesByRegion, 
  searchCountries, 
  getPopularCountries,
  FLAG_SIZES 
} from '../utils/flags';

const CountrySelector = ({ 
  selectedCountry, 
  onCountryChange, 
  placeholder = "Select a country...",
  showSearch = true,
  showRegions = true,
  showPopular = true,
  flagSize = FLAG_SIZES.MEDIUM,
  className = "",
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Get countries organized by region
  const countriesByRegion = useMemo(() => getCountriesByRegion(), []);
  
  // Get popular countries
  const popularCountries = useMemo(() => getPopularCountries(), []);
  
  // Filter countries based on search and region
  const filteredCountries = useMemo(() => {
    let countries = Object.values(countryFlags);
    
    // Filter by region
    if (selectedRegion !== 'all') {
      countries = countries.filter(country => country.region === selectedRegion);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      countries = searchCountries(searchQuery);
      if (selectedRegion !== 'all') {
        countries = countries.filter(country => country.region === selectedRegion);
      }
    }
    
    return countries.sort((a, b) => a.name.localeCompare(b.name));
  }, [searchQuery, selectedRegion]);

  // Get region names
  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(Object.values(countryFlags).map(c => c.region))];
    return uniqueRegions.sort();
  }, []);

  const handleCountrySelect = (countryCode) => {
    onCountryChange(countryCode);
    setIsOpen(false);
    setSearchQuery('');
    setSelectedRegion('all');
  };

  const selectedCountryData = countryFlags[selectedCountry?.toUpperCase()];

  return (
    <div className={`relative ${className}`}>
      {/* Selected Country Display */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`w-full flex items-center justify-between px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-600 cursor-pointer'
        }`}
      >
        <div className="flex items-center space-x-3">
          {selectedCountryData ? (
            <>
              <img
                src={getFlagUrl(selectedCountryData.code, flagSize)}
                alt={`${selectedCountryData.name} flag`}
                className="w-6 h-6 rounded"
                onError={(e) => {
                  e.target.src = getFlagUrl('us', flagSize); // Fallback to US flag
                }}
              />
              <span>{selectedCountryData.name}</span>
            </>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-600 rounded-md shadow-lg max-h-96 overflow-hidden">
          {/* Search Bar */}
          {showSearch && (
            <div className="p-3 border-b border-gray-600">
              <input
                type="text"
                placeholder="Search countries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          )}

          {/* Region Filter */}
          {showRegions && (
            <div className="p-3 border-b border-gray-600">
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Regions</option>
                {regions.map(region => (
                  <option key={region} value={region}>{region}</option>
                ))}
              </select>
            </div>
          )}

          {/* Popular Countries */}
          {showPopular && searchQuery === '' && selectedRegion === 'all' && (
            <div className="p-3 border-b border-gray-600">
              <h4 className="text-sm font-medium text-gray-300 mb-2">Popular Countries</h4>
              <div className="grid grid-cols-2 gap-2">
                {popularCountries.map(country => (
                  <button
                    key={country.code}
                    onClick={() => handleCountrySelect(country.code)}
                    className="flex items-center space-x-2 p-2 rounded hover:bg-gray-700 text-left"
                  >
                    <img
                      src={getFlagUrl(country.code, FLAG_SIZES.SMALL)}
                      alt={`${country.name} flag`}
                      className="w-5 h-5 rounded"
                      onError={(e) => {
                        e.target.src = getFlagUrl('us', FLAG_SIZES.SMALL);
                      }}
                    />
                    <span className="text-sm text-white">{country.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Countries List */}
          <div className="max-h-64 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                No countries found matching "{searchQuery}"
              </div>
            ) : (
              filteredCountries.map(country => (
                <button
                  key={country.code}
                  onClick={() => handleCountrySelect(country.code)}
                  className={`w-full flex items-center space-x-3 p-3 hover:bg-gray-700 text-left ${
                    selectedCountry?.toUpperCase() === country.code ? 'bg-blue-600' : ''
                  }`}
                >
                  <img
                    src={getFlagUrl(country.code, flagSize)}
                    alt={`${country.name} flag`}
                    className="w-6 h-6 rounded"
                    onError={(e) => {
                      e.target.src = getFlagUrl('us', flagSize);
                    }}
                  />
                  <div className="flex-1">
                    <div className="text-white font-medium">{country.name}</div>
                    <div className="text-sm text-gray-400">{country.region}</div>
                  </div>
                  {selectedCountry?.toUpperCase() === country.code && (
                    <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountrySelector;
