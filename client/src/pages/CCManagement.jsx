import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const CCManagement = () => {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedCards, setSelectedCards] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    minPrice: '',
    maxPrice: '',
    cardType: 'all'
  });
  const [editingCard, setEditingCard] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [bulkAction, setBulkAction] = useState('');

  useEffect(() => {
    fetchCards();
  }, [currentPage, filters]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 50,
        ...filters
      });

      const response = await axios.get(`/api/credit-cards?${params}`);
      
      if (response.data.success) {
        setCards(response.data.data);
        setTotalPages(response.data.pagination.pages);
      } else {
        setError('Failed to fetch credit cards');
      }
    } catch (error) {
      console.error('Error fetching credit cards:', error);
      setError('Error loading credit cards');
    } finally {
      setLoading(false);
    }
  };

  const handleCardSelect = (cardId) => {
    setSelectedCards(prev => 
      prev.includes(cardId) 
        ? prev.filter(id => id !== cardId)
        : [...prev, cardId]
    );
  };

  const handleSelectAll = () => {
    if (selectedCards.length === cards.length) {
      setSelectedCards([]);
    } else {
      setSelectedCards(cards.map(card => card.id));
    }
  };

  const handleBulkAction = async () => {
    if (selectedCards.length === 0) return;

    try {
      switch (bulkAction) {
        case 'delete':
          if (confirm(`Are you sure you want to delete ${selectedCards.length} cards?`)) {
            await axios.post('/api/credit-cards/bulk-delete', { cardIds: selectedCards });
            setSelectedCards([]);
            fetchCards();
          }
          break;
        case 'status':
          const newStatus = prompt('Enter new status (available, sold, expired, invalid):');
          if (newStatus && ['available', 'sold', 'expired', 'invalid'].includes(newStatus)) {
            await axios.post('/api/credit-cards/bulk-update-status', { 
              cardIds: selectedCards, 
              status: newStatus 
            });
            setSelectedCards([]);
            fetchCards();
          }
          break;
        case 'price':
          const newPrice = prompt('Enter new price:');
          if (newPrice && !isNaN(parseFloat(newPrice))) {
            await axios.post('/api/credit-cards/bulk-update-price', { 
              cardIds: selectedCards, 
              price: parseFloat(newPrice) 
            });
            setSelectedCards([]);
            fetchCards();
          }
          break;
      }
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert('Error performing bulk action: ' + error.message);
    }
  };

  const handleEditCard = (card) => {
    setEditingCard(card);
  };

  const handleSaveCard = async (updatedCard) => {
    try {
      await axios.put(`/api/credit-cards/${updatedCard.id}`, updatedCard);
      setEditingCard(null);
      fetchCards();
    } catch (error) {
      console.error('Error updating card:', error);
      alert('Error updating card: ' + error.message);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (confirm('Are you sure you want to delete this card?')) {
      try {
        await axios.delete(`/api/credit-cards/${cardId}`);
        fetchCards();
      } catch (error) {
        console.error('Error deleting card:', error);
        alert('Error deleting card: ' + error.message);
      }
    }
  };

  const getCardType = (cardNumber) => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'Visa';
    if (cleanNumber.startsWith('5')) return 'Mastercard';
    if (cleanNumber.startsWith('3')) return 'American Express';
    if (cleanNumber.startsWith('6')) return 'Discover';
    return 'Unknown';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'available': return 'text-green-500 bg-green-100';
      case 'sold': return 'text-blue-500 bg-blue-100';
      case 'expired': return 'text-yellow-500 bg-yellow-100';
      case 'invalid': return 'text-red-500 bg-red-100';
      default: return 'text-gray-500 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-white mt-4">Loading credit cards...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-white mb-2">Error Loading Credit Cards</h1>
          <p className="text-gray-400">{error}</p>
          <button 
            onClick={fetchCards}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-white">⚙️ CC Data Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/admin/cc-dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-lg font-semibold text-white mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search cards..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="available">Available</option>
                <option value="sold">Sold</option>
                <option value="expired">Expired</option>
                <option value="invalid">Invalid</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Min Price</label>
              <input
                type="number"
                placeholder="Min price"
                value={filters.minPrice}
                onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Max Price</label>
              <input
                type="number"
                placeholder="Max price"
                value={filters.maxPrice}
                onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Card Type</label>
              <select
                value={filters.cardType}
                onChange={(e) => setFilters({...filters, cardType: e.target.value})}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Types</option>
                <option value="Visa">Visa</option>
                <option value="Mastercard">Mastercard</option>
                <option value="American Express">American Express</option>
                <option value="Discover">Discover</option>
              </select>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedCards.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-white">
                  {selectedCards.length} card(s) selected
                </span>
                <button
                  onClick={handleSelectAll}
                  className="text-blue-400 hover:text-blue-300 text-sm"
                >
                  {selectedCards.length === cards.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="flex items-center space-x-4">
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  className="px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Action</option>
                  <option value="delete">Delete Selected</option>
                  <option value="status">Update Status</option>
                  <option value="price">Update Price</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm transition-colors"
                >
                  Apply Action
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Credit Cards Table */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedCards.length === cards.length && cards.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Card Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Personal Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Price & Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Import Info
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {cards.map((card) => (
                  <tr key={card.id} className="hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedCards.includes(card.id)}
                        onChange={() => handleCardSelect(card.id)}
                        className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">💳</span>
                          <div>
                            <p className="text-white font-medium">{card.card_number}</p>
                            <p className="text-gray-400 text-sm">{getCardType(card.card_number)}</p>
                          </div>
                        </div>
                        <div className="text-sm text-gray-400">
                          <span>Exp: {card.month}/{card.year}</span>
                          <span className="mx-2">•</span>
                          <span>CVV: {card.cvv}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <p className="text-white text-sm">
                          {card.first_name} {card.last_name}
                        </p>
                        <p className="text-gray-400 text-sm">
                          {card.city}, {card.zip}
                        </p>
                        {card.email && (
                          <p className="text-gray-400 text-sm">{card.email}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-2">
                        <p className="text-green-400 font-bold">${card.price.toFixed(2)}</p>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(card.status)}`}>
                          {card.status}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-gray-400">
                        <p>Imported: {new Date(card.imported_at).toLocaleDateString()}</p>
                        <p>Delimiter: {card.delimiter}</p>
                        {card.notes && (
                          <p className="truncate max-w-xs" title={card.notes}>
                            Notes: {card.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEditCard(card)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCard(card.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-white">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {/* No Results */}
        {cards.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💳</div>
            <h2 className="text-2xl font-bold text-white mb-2">No Credit Cards Found</h2>
            <p className="text-gray-400">
              No cards match your current filters. Try adjusting your search criteria or import some cards first.
            </p>
            <Link
              to="/admin/cc-import"
              className="mt-4 inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Import Cards
            </Link>
          </div>
        )}
      </div>

      {/* Edit Card Modal */}
      {editingCard && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Edit Credit Card</h2>
                <button
                  onClick={() => setEditingCard(null)}
                  className="text-gray-400 hover:text-white text-2xl"
                >
                  ✕
                </button>
              </div>

              <EditCardForm
                card={editingCard}
                onSave={handleSaveCard}
                onCancel={() => setEditingCard(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Edit Card Form Component
const EditCardForm = ({ card, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    card_number: card.card_number,
    month: card.month,
    year: card.year,
    cvv: card.cvv,
    first_name: card.first_name,
    last_name: card.last_name,
    street: card.street,
    city: card.city,
    zip: card.zip,
    price: card.price,
    status: card.status,
    notes: card.notes
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ ...card, ...formData });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Card Number</label>
          <input
            type="text"
            value={formData.card_number}
            onChange={(e) => setFormData({...formData, card_number: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">CVV</label>
          <input
            type="text"
            value={formData.cvv}
            onChange={(e) => setFormData({...formData, cvv: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Month</label>
          <input
            type="text"
            value={formData.month}
            onChange={(e) => setFormData({...formData, month: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Year</label>
          <input
            type="text"
            value={formData.year}
            onChange={(e) => setFormData({...formData, year: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
          <input
            type="text"
            value={formData.first_name}
            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Last Name</label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({...formData, last_name: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">ZIP</label>
          <input
            type="text"
            value={formData.zip}
            onChange={(e) => setFormData({...formData, zip: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Price</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({...formData, price: parseFloat(e.target.value)})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Status</label>
          <select
            value={formData.status}
            onChange={(e) => setFormData({...formData, status: e.target.value})}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="available">Available</option>
            <option value="sold">Sold</option>
            <option value="expired">Expired</option>
            <option value="invalid">Invalid</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({...formData, notes: e.target.value})}
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex space-x-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Save Changes
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default CCManagement;
