import React, { useState, useMemo, useEffect } from 'react';
import { useCart } from '../contexts/CartContext.jsx';
import { useAuth } from '../contexts/AuthContext.jsx';

const CreditCards = () => {
  const { cart, addToCart, removeFromCart, isInCart, cartTotal } = useCart();
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    search: '',
    minPrice: '',
    maxPrice: '',
    status: 'all'
  });

  const [selectedCard, setSelectedCard] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [toasts, setToasts] = useState([]);




  // Fetch credit cards from API
  const fetchCreditCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build query parameters
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });
      
      if (filters.search) params.append('search', filters.search);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      
      const response = await fetch(`/api/credit-cards?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success && result.data) {
        setCards(result.data);
        setTotalPages(result.pagination?.pages || 1);
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to fetch credit cards');
      }
      
    } catch (err) {
      console.error('Error fetching credit cards:', err);
      setError(err.message);
      setCards([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount and when page changes
  useEffect(() => {
    fetchCreditCards();
  }, [currentPage]);

  // Refetch when filters change
  useEffect(() => {
    setCurrentPage(1); // Reset to first page when filters change
    fetchCreditCards();
  }, [filters]);

  // Get current page cards (data is already paginated from API)
  const currentCards = useMemo(() => {
    return cards;
  }, [cards]);

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  // Handle filters change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset to first page when filters change
  };

  // Add card to cart
  const handleAddToCart = (card) => {
    addToCart({
      id: card.id,
      type: 'credit-card',
      brand: card.bank || 'Unknown',
      bin: card.card_number.substring(0, 6),
      price: card.price,
      card_number: formatCardNumber(card.card_number), // Use masked version
      expiry: `${card.month}/${card.year}`,
      name: `${card.first_name} ${card.last_name}`,
      address: `${card.street ? card.street + ', ' : ''}${card.city}, ${card.zip}`,
      phone: card.phone
    });
    
    // Show success toast
    setToasts(prev => [...prev, { id: Date.now(), message: 'Card added to cart!', type: 'success' }]);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== Date.now()));
    }, 3000);
  };

  // Remove card from cart
  const handleRemoveFromCart = (card) => {
    removeFromCart(card.id);
    
    // Show success toast
    setToasts(prev => [...prev, { id: Date.now(), message: 'Card removed from cart!', type: 'success' }]);
    
    // Remove toast after 3 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(toast => toast.id !== Date.now()));
    }, 3000);
  };

  // Show card details modal
  const showCardDetails = (card) => {
    setSelectedCard(card);
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedCard(null);
  };

  // Format card number for display - show only BIN and mask the rest
  const formatCardNumber = (cardNumber) => {
    if (!cardNumber) return '';
    // Show first 6 digits (BIN) and mask the rest
    const bin = cardNumber.substring(0, 6);
    const masked = cardNumber.substring(6).replace(/\d/g, '*');
    return `${bin} ${masked.replace(/(.{4})/g, '$1 ').trim()}`;
  };

  // Get BIN number (first 6 digits)
  const getBinNumber = (cardNumber) => {
    if (!cardNumber) return '';
    return cardNumber.substring(0, 6);
  };

  // Get card brand icon
  const getCardBrandIcon = (bank) => {
    switch (bank.toLowerCase()) {
      case 'visa':
        return '💳';
      case 'mastercard':
        return '💳';
      case 'american express':
        return '💳';
      case 'discover':
        return '💳';
      default:
        return '💳';
    }
  };

  // Get card brand color
  const getCardBrandColor = (bank) => {
    switch (bank.toLowerCase()) {
      case 'visa':
        return 'text-blue-400';
      case 'mastercard':
        return 'text-red-400';
      case 'american express':
        return 'text-green-400';
      case 'discover':
        return 'text-orange-400';
      default:
        return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading credit cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-white">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Credit Cards</h1>
        <p className="text-gray-400">Browse and purchase premium credit card data</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-lg p-4 lg:p-6 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search cards..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Min Price</label>
            <input
              type="number"
              placeholder="Min price"
              value={filters.minPrice}
              onChange={(e) => handleFilterChange('minPrice', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Price</label>
            <input
              type="number"
              placeholder="Max price"
              value={filters.maxPrice}
              onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-800 border border-red-600 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-400 mr-2">⚠️</span>
            <p className="text-red-200">Error: {error}</p>
          </div>
          <div className="mt-3">
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-connection');
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  const result = await response.json();
                  console.log('Environment test result:', result);
                  if (result.success) {
                    alert(`Environment test: ${JSON.stringify(result.tests.environment, null, 2)}`);
                  } else {
                    alert(`Environment test failed: ${result.error} - ${result.message}`);
                  }
                } catch (err) {
                  console.error('Test failed:', err);
                  alert('Test failed: ' + err.message);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm mr-2"
            >
              Test Environment Variables
            </button>
            <button
              onClick={async () => {
                try {
                  const response = await fetch('/api/test-connection');
                  if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                  }
                  const result = await response.json();
                  console.log('Connection test result:', result);
                  if (result.success) {
                    alert(`Connection test: ${JSON.stringify(result.tests, null, 2)}`);
                  } else {
                    alert(`Connection test failed: ${result.error} - ${result.message}`);
                  }
                } catch (err) {
                  console.error('Connection test failed:', err);
                  alert('Connection test failed: ' + err.message);
                }
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
            >
              Test Database Connection
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-gray-400">
          Showing {currentCards.length} cards
          {totalPages > 1 && ` (Page ${currentPage} of ${totalPages})`}
        </p>
      </div>

      {/* Cards Grid */}
      {currentCards.length === 0 && !loading ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">💳</div>
          <h3 className="text-xl font-semibold text-gray-300 mb-2">No Credit Cards Found</h3>
          <p className="text-gray-400 mb-6">
            {error ? error : 'No credit cards are currently available in the database.'}
          </p>
          {error && (
            <button
              onClick={fetchCreditCards}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6 mb-8">
          {currentCards.map((card) => (
            <div key={card.id} className="bg-gray-800 rounded-lg p-4 lg:p-6 border border-gray-700 hover:border-gray-600 transition-colors">
              {/* Card Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <span className="text-xl lg:text-2xl">{getCardBrandIcon(card.bank)}</span>
                  <span className={`text-xs lg:text-sm ${getCardBrandColor(card.bank)} font-medium`}>{card.bank}</span>
                </div>
                <span className="text-green-400 font-bold text-sm lg:text-base">${card.price}</span>
              </div>
              
              {/* Card Number */}
              <div className="mb-4">
                <p className="text-xs lg:text-sm text-gray-400 mb-1">Card Number (BIN: {getBinNumber(card.card_number)})</p>
                <p className="font-mono text-sm lg:text-lg text-white break-all">{formatCardNumber(card.card_number)}</p>
              </div>
              
              {/* Card Details */}
              <div className="mb-4">
                <div>
                  <p className="text-xs lg:text-sm text-gray-400 mb-1">Expiry</p>
                  <p className="text-white text-sm lg:text-base">{card.month}/{card.year}</p>
                </div>
              </div>
              
              {/* Cardholder Info */}
              <div className="mb-4">
                <p className="text-xs lg:text-sm text-gray-400 mb-1">Cardholder</p>
                <p className="text-white text-sm lg:text-base">{card.first_name} {card.last_name}</p>
                <p className="text-xs lg:text-sm text-gray-400">{card.city}, {card.zip}</p>
              </div>
              
              {/* Actions */}
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                <button
                  onClick={() => showCardDetails(card)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 lg:px-4 py-2 rounded transition-colors text-sm"
                >
                  View Details
                </button>
                
                {isInCart(card.id) ? (
                  <button
                    onClick={() => handleRemoveFromCart(card)}
                    className="bg-red-600 hover:bg-red-700 text-white px-3 lg:px-4 py-2 rounded transition-colors text-sm"
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    onClick={() => handleAddToCart(card)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 lg:px-4 py-2 rounded transition-colors text-sm"
                  >
                    Add to Cart
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Previous
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => handlePageChange(page)}
              className={`px-4 py-2 rounded transition-colors ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-gray-700 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-600 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* Card Details Modal */}
      {showModal && selectedCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg p-4 lg:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 lg:mb-6">
              <h2 className="text-xl lg:text-2xl font-bold text-white">Card Details</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white text-xl lg:text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Card Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">Card Number (BIN: {getBinNumber(selectedCard.card_number)})</p>
                    <p className="text-white text-sm lg:text-lg break-all">{formatCardNumber(selectedCard.card_number)}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">Expiry Date</p>
                    <p className="text-white text-sm lg:text-base">{selectedCard.month}/{selectedCard.year}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">Bank</p>
                    <p className="text-white text-sm lg:text-base">{selectedCard.bank}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">Type</p>
                    <p className="text-white text-sm lg:text-base">{selectedCard.type}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-base lg:text-lg font-semibold text-white mb-3 lg:mb-4">Cardholder Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">Full Name</p>
                    <p className="text-white text-sm lg:text-base">{selectedCard.first_name} {selectedCard.last_name}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">Address</p>
                    <p className="text-white text-sm lg:text-base">{selectedCard.street ? `${selectedCard.street}, ` : ''}{selectedCard.city}, {selectedCard.zip}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">City</p>
                    <p className="text-white text-sm lg:text-base">{selectedCard.city}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">ZIP Code</p>
                    <p className="text-white text-sm lg:text-base">{selectedCard.zip}</p>
                  </div>
                  <div>
                    <p className="text-xs lg:text-sm text-gray-400">Phone</p>
                    <p className="text-white text-sm lg:text-base">{selectedCard.phone}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-6 pt-4 lg:pt-6 border-t border-gray-700">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
                <div>
                  <p className="text-xl lg:text-2xl font-bold text-green-400">${selectedCard.price}</p>
                  <p className="text-xs lg:text-sm text-gray-400">Price</p>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  {isInCart(selectedCard.id) ? (
                    <button
                      onClick={() => {
                        handleRemoveFromCart(selectedCard);
                        closeModal();
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg transition-colors text-sm lg:text-base"
                    >
                      Remove from Cart
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        handleAddToCart(selectedCard);
                        closeModal();
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 lg:px-6 py-2 lg:py-3 rounded-lg transition-colors text-sm lg:text-base"
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-6 py-3 rounded-lg text-white shadow-lg transition-all duration-300 ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CreditCards;

