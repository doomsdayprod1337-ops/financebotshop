import React, { useState, useMemo } from 'react';
import { useCart } from '../contexts/CartContext.jsx';

const CreditCards = () => {
  const { cart, addToCart, removeFromCart, isInCart, cartTotal } = useCart();
  const [cards] = useState([
    {
      id: 1,
      type: 'Visa',
      number: '4362 4323 **** ****',
      country: 'US',
      state: 'NY',
      city: 'New York',
      zip: '10001',
      bank: 'Chase Bank',
      bin: '436243',
      price: 25.00,
      status: 'available',
      cvv: '123',
      exp: '12/25',
      level: 'WORLD',
      class: 'CREDIT',
      dateAdded: '2024-01-15',
      address: '123 Main St, New York, NY 10001',
      bankPhone: '+1 (212) 555-0123',
      bankAddress: '270 Park Ave, New York, NY 10172',
      fullBin: '4362430000000000',
      hasSSN: true,
      hasDOB: true,
      hasFingerprint: true,
      hasEmail: true,
      hasPhone: true,
      hasEmailAccess: false,
      hasDL: true,
      database: 'FULLZ-DB#4',
      refundTime: '5 min'
    },
    {
      id: 2,
      type: 'Mastercard',
      number: '5555 5555 **** ****',
      country: 'GB',
      state: null,
      city: 'London',
      zip: 'W1C 1AP',
      bank: 'Barclays',
      bin: '555555',
      price: 18.50,
      status: 'available',
      cvv: '456',
      exp: '03/26',
      level: 'CLASSIC',
      class: 'CREDIT',
      dateAdded: '2024-01-14',
      address: '456 Oxford St, London, UK W1C 1AP',
      bankPhone: '+44 20 7111 1111',
      bankAddress: '1 Churchill Place, London, UK E14 5HP',
      fullBin: '5555550000000000',
      hasSSN: false,
      hasDOB: true,
      hasFingerprint: false,
      hasEmail: true,
      hasPhone: false,
      hasEmailAccess: true,
      hasDL: false,
      database: 'FULLZ-DB#4',
      refundTime: '5 min'
    },
    {
      id: 3,
      type: 'American Express',
      number: '3782 8224 **** ****',
      country: 'DE',
      state: null,
      city: 'Berlin',
      zip: '10117',
      bank: 'Deutsche Bank',
      bin: '378282',
      price: 32.00,
      status: 'available',
      cvv: '789',
      exp: '08/25',
      level: 'PLATINUM',
      class: 'CREDIT',
      dateAdded: '2024-01-13',
      address: '789 Unter den Linden, Berlin, Germany 10117',
      bankPhone: '+49 30 227 0',
      bankAddress: 'Taunusanlage 12, Frankfurt am Main, Germany 60325',
      fullBin: '3782820000000000',
      hasSSN: false,
      hasDOB: true,
      hasFingerprint: true,
      hasEmail: false,
      hasPhone: true,
      hasEmailAccess: false,
      hasDL: true,
      database: 'FULLZ-DB#4',
      refundTime: '5 min'
    },
    {
      id: 4,
      type: 'Visa',
      number: '4222 2222 **** ****',
      country: 'US',
      state: 'CA',
      city: 'San Francisco',
      zip: '94105',
      bank: 'Wells Fargo',
      bin: '422222',
      price: 28.00,
      status: 'available',
      cvv: '321',
      exp: '06/26',
      level: 'WORLD',
      class: 'CREDIT',
      dateAdded: '2024-01-12',
      address: '321 Market St, San Francisco, CA 94105',
      bankPhone: '+1 (415) 396-1776',
      bankAddress: '420 Montgomery St, San Francisco, CA 94104',
      fullBin: '4222220000000000',
      hasSSN: true,
      hasDOB: true,
      hasFingerprint: true,
      hasEmail: true,
      hasPhone: true,
      hasEmailAccess: true,
      hasDL: true,
      database: 'FULLZ-DB#4',
      refundTime: '5 min'
    },
    {
      id: 5,
      type: 'Mastercard',
      number: '5105 1051 **** ****',
      country: 'US',
      state: 'TX',
      city: 'Dallas',
      zip: '75202',
      bank: 'Bank of America',
      bin: '510510',
      price: 22.00,
      status: 'available',
      cvv: '654',
      exp: '09/25',
      level: 'CLASSIC',
      class: 'CREDIT',
      dateAdded: '2024-01-11',
      address: '654 Commerce St, Dallas, TX 75202',
      bankPhone: '+1 (214) 979-7000',
      bankAddress: '901 Main St, Dallas, TX 75202',
      fullBin: '5105100000000000',
      hasSSN: true,
      hasDOB: false,
      hasFingerprint: false,
      hasEmail: true,
      hasPhone: true,
      hasEmailAccess: false,
      hasDL: true,
      database: 'FULLZ-DB#4',
      refundTime: '5 min'
    },
    {
      id: 6,
      type: 'Visa',
      number: '4000 0000 **** ****',
      country: 'US',
      state: 'FL',
      city: 'Miami',
      zip: '33132',
      bank: 'Citibank',
      bin: '400000',
      price: 30.00,
      status: 'available',
      cvv: '111',
      exp: '05/26',
      level: 'WORLD',
      class: 'CREDIT',
      dateAdded: '2024-01-10',
      address: '111 Biscayne Blvd, Miami, FL 33132',
      bankPhone: '+1 (305) 375-5000',
      bankAddress: '388 Greenwich St, New York, NY 10013',
      fullBin: '4000000000000000',
      hasSSN: true,
      hasDOB: true,
      hasFingerprint: true,
      hasEmail: true,
      hasPhone: true,
      hasEmailAccess: true,
      hasDL: true,
      database: 'FULLZ-DB#4',
      refundTime: '5 min'
    },
    {
      id: 7,
      type: 'Discover',
      number: '6011 0000 **** ****',
      country: 'US',
      state: 'IL',
      city: 'Chicago',
      zip: '60606',
      bank: 'Discover Bank',
      bin: '601100',
      price: 20.00,
      status: 'available',
      cvv: '222',
      exp: '07/25',
      level: 'CLASSIC',
      class: 'CREDIT',
      dateAdded: '2024-01-09',
      address: '222 W Adams St, Chicago, IL 60606',
      bankPhone: '+1 (800) 347-2683',
      bankAddress: '2500 Lake Cook Rd, Riverwoods, IL 60015',
      fullBin: '6011000000000000',
      hasSSN: false,
      hasDOB: true,
      hasFingerprint: false,
      hasEmail: false,
      hasPhone: true,
      hasEmailAccess: false,
      hasDL: false,
      database: 'FULLZ-DB#4',
      refundTime: '5 min'
    },
    {
      id: 8,
      type: 'Visa',
      number: '4111 1111 **** ****',
      country: 'CA',
      state: 'BC',
      city: 'Vancouver',
      zip: 'V6B 1A1',
      bank: 'Royal Bank of Canada',
      bin: '411111',
      price: 35.00,
      status: 'available',
      cvv: '333',
      exp: '04/26',
      level: 'WORLD',
      class: 'CREDIT',
      dateAdded: '2024-01-08',
      address: '888 West Georgia St, Vancouver, BC V6B 1A1',
      bankPhone: '+1 (604) 665-5000',
      bankAddress: '200 Bay St, Toronto, ON M5J 2J5',
      fullBin: '4111110000000000',
      hasSSN: false,
      hasDOB: true,
      hasFingerprint: true,
      hasEmail: true,
      hasPhone: false,
      hasEmailAccess: true,
      hasDL: true,
      database: 'FULLZ-DB#4',
      refundTime: '5 min'
    }
  ]);

  const [filters, setFilters] = useState({
    type: '',
    country: '',
    state: '',
    level: '',
    price: '',
    bin: '',
    bank: '',
    dateAdded: ''
  });

  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState([]);

  // Get unique dates from available cards for the combobox
  const availableDates = useMemo(() => {
    const dates = [...new Set(cards.map(card => card.dateAdded))];
    return dates.sort((a, b) => new Date(b) - new Date(a)); // Sort by newest first
  }, [cards]);





  // Format date for display
  const formatDateForDisplay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const usStates = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const banks = [
    'Chase Bank', 'Bank of America', 'Wells Fargo', 'Citibank',
    'Barclays', 'Deutsche Bank', 'HSBC', 'Capital One', 'American Express',
    'Discover', 'US Bank', 'PNC Bank', 'TD Bank', 'BB&T', 'SunTrust'
  ];

  const filteredCards = cards.filter(card => {
    if (filters.type && card.type !== filters.type) return false;
    if (filters.country && card.country !== filters.country) return false;
    if (filters.country === 'US' && filters.state && card.state !== filters.state) return false;
    if (filters.level && card.level !== filters.level) return false;
    if (filters.bank && card.bank !== filters.bank) return false;
    if (filters.dateAdded && card.dateAdded !== filters.dateAdded) return false;
    
    // BIN filtering - check if any of the entered BINs match
    if (filters.bin) {
      const binList = filters.bin.split(/[,;]/).map(b => b.trim()).filter(b => b);
      if (!binList.some(bin => card.bin.startsWith(bin))) return false;
    }
    
    return true;
  });

  const handleBinChange = (value) => {
    // Clean up the BIN input - remove extra spaces and validate format
    const cleanedValue = value.replace(/\s+/g, '').replace(/[^0-9,;]/g, '');
    setFilters({...filters, bin: cleanedValue});
  };

  const handleCardClick = (card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedCard(null);
  };

  const showToast = (message, type = 'success') => {
    console.log('Showing toast:', message, type); // Debug log
    const id = Date.now();
    const newToast = { id, message, type, timestamp: Date.now() };
    setToasts(prev => [...prev, newToast]);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== id));
    }, 5000);
  };

  const handleAddToCart = (card) => {
    if (!isInCart(card.id)) {
      addToCart(card);
      
      // Show toast notification
      showToast(
        `Added ${card.type} - ${card.bin} ${card.bank} ${card.class} ${card.level} To Cart - $${card.price.toFixed(2)}`,
        'success'
      );
      
      // Show total toast after a short delay
      setTimeout(() => {
        showToast(`Total is now - $${(cartTotal + card.price).toFixed(2)}`, 'info');
      }, 500);
    }
  };

  const handleRemoveFromCart = (cardId) => {
    const cardToRemove = cart.find(item => item.id === cardId);
    
    if (cardToRemove) {
      removeFromCart(cardId);
      
      showToast(
        `Removed ${cardToRemove.type} - ${cardToRemove.bin} From Cart`,
        'warning'
      );
      
      if (cart.length > 1) {
        setTimeout(() => {
          showToast(`Total is now - $${(cartTotal - cardToRemove.price).toFixed(2)}`, 'info');
        }, 500);
      } else {
        setTimeout(() => {
          showToast('Cart is now empty', 'info');
        }, 500);
      }
    }
  };

  const getCardIcon = (type) => {
    switch (type) {
      case 'Visa':
        return <div className="w-6 h-4 bg-blue-600 text-white text-xs flex items-center justify-center font-bold rounded">VISA</div>;
      case 'Mastercard':
        return <div className="w-6 h-4 bg-orange-500 text-white text-xs flex items-center justify-center font-bold rounded">MC</div>;
      case 'American Express':
        return <div className="w-6 h-4 bg-green-600 text-white text-xs flex items-center justify-center font-bold rounded">AMEX</div>;
      case 'Discover':
        return <div className="w-6 h-4 bg-orange-400 text-white text-xs flex items-center justify-center font-bold rounded">DISC</div>;
      default:
        return <div className="w-6 h-4 bg-gray-600 text-white text-xs flex items-center justify-center font-bold rounded">CARD</div>;
    }
  };

  const getCountryFlag = (country) => {
    const flags = {
      'US': '🇺🇸',
      'GB': '🇬🇧',
      'DE': '🇩🇪',
      'CA': '🇨🇦',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'NL': '🇳🇱'
    };
    return flags[country] || '🌍';
  };

  return (
    <div className="space-y-6">
      {/* Toast Notifications */}
      <div className="fixed top-4 right-4 z-50">
        <div className="toast-panel">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`toast-item ${toast.type}`}
            >
              <div className={`toast ${toast.type}`}>
                <label
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="close"
                ></label>
                <h3>{toast.type === 'success' ? 'Success!' : 
                     toast.type === 'warning' ? 'Warning!' : 
                     toast.type === 'error' ? 'Error!' : 
                     toast.type === 'info' ? 'Info!' : 'Message!'}</h3>
                <p>{toast.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Fallback Simple Toast Notifications */}
      <div className="fixed top-4 right-4 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`mb-2 p-4 rounded-lg shadow-lg max-w-sm transform transition-all duration-300 ${
              toast.type === 'success' ? 'bg-green-600 text-white' :
              toast.type === 'warning' ? 'bg-yellow-600 text-white' :
              toast.type === 'error' ? 'bg-red-600 text-white' :
              toast.type === 'info' ? 'bg-blue-600 text-white' :
              'bg-gray-600 text-white'
            }`}
            style={{
              transform: 'translateX(0)',
              opacity: 1
            }}
          >
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-sm">
                  {toast.type === 'success' ? 'Success!' : 
                   toast.type === 'warning' ? 'Warning!' : 
                   toast.type === 'error' ? 'Error!' : 
                   toast.type === 'info' ? 'Info!' : 'Message!'}
                </h4>
                <p className="text-sm mt-1">{toast.message}</p>
              </div>
              <button
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                className="text-white hover:text-gray-200 text-lg font-bold ml-2"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <h1 className="text-3xl font-bold text-white">Credit Cards</h1>
      
      
      
      {/* Filters */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Card Type</label>
            <select
              value={filters.type}
              onChange={(e) => setFilters({...filters, type: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Types</option>
              <option value="Visa">Visa</option>
              <option value="Mastercard">Mastercard</option>
              <option value="American Express">American Express</option>
              <option value="Discover">Discover</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Country</label>
            <select
              value={filters.country}
              onChange={(e) => {
                setFilters({...filters, country: e.target.value, state: ''});
              }}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Countries</option>
              <option value="US">🇺🇸 United States</option>
              <option value="GB">🇬🇧 United Kingdom</option>
              <option value="DE">🇩🇪 Germany</option>
              <option value="FR">🇫🇷 France</option>
              <option value="CA">🇨🇦 Canada</option>
            </select>
          </div>

          {filters.country === 'US' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">State</label>
              <select
                value={filters.state}
                onChange={(e) => setFilters({...filters, state: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All States</option>
                {usStates.map(state => (
                  <option key={state} value={state}>{state}</option>
                ))}
              </select>
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({...filters, level: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Levels</option>
              <option value="WORLD">WORLD</option>
              <option value="PLATINUM">PLATINUM</option>
              <option value="CLASSIC">CLASSIC</option>
              <option value="PREPAID">PREPAID</option>
              <option value="ELECTRON">ELECTRON</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Price Range</label>
            <select
              value={filters.price}
              onChange={(e) => setFilters({...filters, price: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Prices</option>
              <option value="0-20">$0 - $20</option>
              <option value="20-50">$20 - $50</option>
              <option value="50+">$50+</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">BIN</label>
            <input
              type="text"
              placeholder="e.g., 411111, 555555; 378282"
              value={filters.bin}
              onChange={(e) => handleBinChange(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1">Separate multiple BINs with comma or semicolon</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Bank</label>
            <select
              value={filters.bank}
              onChange={(e) => setFilters({...filters, bank: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Banks</option>
              {banks.map(bank => (
                <option key={bank} value={bank}>{bank}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Date Added</label>
            <select
              value={filters.dateAdded}
              onChange={(e) => setFilters({...filters, dateAdded: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Dates</option>
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {formatDateForDisplay(date)}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-400 mt-1">{availableDates.length} dates available</p>
          </div>
        </div>
      </div>

      {/* Credit Cards Table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  BIN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Bank
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Class
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  EXP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  State
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  City
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Zip
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  SSN
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  DOB
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  FP
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Email Access
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  DL
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Cart
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredCards.map((card) => (
                <tr 
                  key={card.id} 
                  className="hover:bg-gray-700 transition-colors cursor-pointer"
                  onClick={() => handleCardClick(card)}
                >
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getCardIcon(card.type)}
                      <span className="text-white text-sm">{card.type}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white font-mono text-sm">{card.bin}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white text-sm">{card.bank}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white text-sm">{card.class}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white text-sm">{card.level}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white text-sm">{card.exp}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getCountryFlag(card.country)}</span>
                      <span className="text-white text-sm">{card.country}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white text-sm">{card.state || 'NA'}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white text-sm">{card.city}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-white text-sm">{card.zip}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {card.hasSSN ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {card.hasDOB ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {card.hasFingerprint ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {card.hasEmail ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {card.hasPhone ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {card.hasEmailAccess ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {card.hasDL ? (
                        <span className="text-green-400">✓</span>
                      ) : (
                        <span className="text-red-400">✗</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="text-green-400 font-bold">${card.price.toFixed(2)}</span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center justify-center">
                      {isInCart(card.id) ? (
                                                 <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleRemoveFromCart(card.id);
                           }}
                           className="text-red-400 hover:text-red-300 text-lg transition-colors"
                           title="Remove from cart"
                         >
                           🗑️
                         </button>
                      ) : (
                                                 <button
                           onClick={(e) => {
                             e.stopPropagation();
                             handleAddToCart(card);
                           }}
                           className="text-blue-400 hover:text-blue-300 text-lg transition-colors"
                           title="Add to cart"
                         >
                           🛒
                         </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* No Results */}
      {filteredCards.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-lg font-medium text-white mb-2">No credit cards found</h3>
          <p className="text-gray-400">Try adjusting your filters or search terms</p>
        </div>
      )}

      {/* Detailed Card Modal */}
      {showModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg border border-gray-700 max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in">
            {/* Modal Header */}
            <div className="p-6 border-b border-gray-700 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Card Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-2xl font-bold"
              >
                ×
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Card Information */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Card Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Number:</span>
                    <span className="text-white font-mono ml-2">{selectedCard.number}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">CVV:</span>
                    <span className="text-white font-mono ml-2">{selectedCard.cvv}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Expiration:</span>
                    <span className="text-white ml-2">{selectedCard.exp}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Level:</span>
                    <span className="text-white ml-2">{selectedCard.level}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Class:</span>
                    <span className="text-white ml-2">{selectedCard.class}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <span className="text-green-400 font-bold ml-2">${selectedCard.price.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* BIN Information */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">BIN Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400">BIN:</span>
                    <span className="text-white font-mono ml-2">{selectedCard.bin}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Full BIN:</span>
                    <span className="text-white font-mono ml-2">{selectedCard.fullBin}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Bank:</span>
                    <span className="text-white ml-2">{selectedCard.bank}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Bank Phone:</span>
                    <span className="text-white ml-2">{selectedCard.bankPhone}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Bank Address:</span>
                    <span className="text-white ml-2">{selectedCard.bankAddress}</span>
                  </div>
                </div>
              </div>

              {/* Location Information */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Location Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-gray-400">Country:</span>
                    <span className="text-white ml-2">{selectedCard.country}</span>
                  </div>
                  {selectedCard.state && (
                    <div>
                      <span className="text-gray-400">State:</span>
                      <span className="text-white ml-2">{selectedCard.state}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-400">City:</span>
                    <span className="text-white ml-2">{selectedCard.city}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">ZIP:</span>
                    <span className="text-white ml-2">{selectedCard.zip}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Address:</span>
                    <span className="text-white ml-2">{selectedCard.address}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Date Added:</span>
                    <span className="text-white ml-2">{formatDateForDisplay(selectedCard.dateAdded)}</span>
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-4">Additional Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">SSN Available:</span>
                    <span className={`ml-2 ${selectedCard.hasSSN ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedCard.hasSSN ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">DOB Available:</span>
                    <span className={`ml-2 ${selectedCard.hasDOB ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedCard.hasDOB ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Fingerprint Available:</span>
                    <span className={`ml-2 ${selectedCard.hasFingerprint ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedCard.hasFingerprint ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email Available:</span>
                    <span className={`ml-2 ${selectedCard.hasEmail ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedCard.hasEmail ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone Available:</span>
                    <span className={`ml-2 ${selectedCard.hasPhone ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedCard.hasPhone ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Email Access:</span>
                    <span className={`ml-2 ${selectedCard.hasEmailAccess ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedCard.hasEmailAccess ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Driver's License:</span>
                    <span className={`ml-2 ${selectedCard.hasDL ? 'text-green-400' : 'text-red-400'}`}>
                      {selectedCard.hasDL ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Refund Time:</span>
                    <span className="text-green-400 ml-2">{selectedCard.refundTime}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-4">
                                 {isInCart(selectedCard.id) ? (
                   <button 
                     onClick={() => handleRemoveFromCart(selectedCard.id)}
                     className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium py-3 px-4 rounded transition-colors"
                   >
                     Remove from Cart
                   </button>
                 ) : (
                   <button 
                     onClick={() => handleAddToCart(selectedCard)}
                     className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded transition-colors"
                   >
                     Add to Cart
                   </button>
                 )}
                <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded transition-colors">
                  Purchase Card
                </button>
                <button 
                  onClick={closeModal}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-3 px-4 rounded transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">About Credit Card Dumps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
          <div>
            <h4 className="font-medium text-white mb-2">What are Dumps?</h4>
            <p>Credit card dumps contain stolen magnetic stripe data including card number, expiration date, and CVV. These can be used to create cloned physical cards.</p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">How to Use</h4>
            <p>After purchase, you'll receive the card data in various formats including .txt files, .bin files, and magnetic stripe data for card cloning devices.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditCards;
