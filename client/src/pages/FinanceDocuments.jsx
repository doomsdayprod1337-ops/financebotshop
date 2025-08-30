import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/axios';

const FinanceDocuments = () => {
  const { user } = useAuth();
  const [financeDocs, setFinanceDocs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  useEffect(() => {
    fetchFinanceDocuments();
  }, []);

  const fetchFinanceDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/api/finance-documents/user-view');
      if (response.data.success) {
        setFinanceDocs(response.data.financeDocuments);
      }
    } catch (error) {
      console.error('Error fetching finance documents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter documents based on search query
  const filteredDocs = financeDocs.filter(doc =>
    doc.reference_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.zip_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Paginate results
  const totalPages = Math.ceil(filteredDocs.length / itemsPerPage);
  const paginatedDocs = filteredDocs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📄 Finance Documents</h1>
          <p className="text-gray-400">
            Browse available finance documents. Sensitive information has been obscured for security.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="search" className="block text-sm font-medium text-gray-300 mb-2">
                Search Documents
              </label>
              <input
                type="text"
                id="search"
                placeholder="Search by reference number, city, state, or ZIP..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setSearchQuery('')}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          <p className="text-gray-400">
            Showing {filteredDocs.length} document{filteredDocs.length !== 1 ? 's' : ''}
            {searchQuery && ` matching "${searchQuery}"`}
          </p>
        </div>

        {/* Documents Table */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-300">
              <thead className="text-xs text-gray-400 uppercase bg-gray-700">
                <tr>
                  <th className="px-6 py-4">Reference Number</th>
                  <th className="px-6 py-4">City</th>
                  <th className="px-6 py-4">State</th>
                  <th className="px-6 py-4">ZIP Code</th>
                  <th className="px-6 py-4">Balance</th>
                  <th className="px-6 py-4">Added</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDocs.length > 0 ? (
                  paginatedDocs.map((doc) => (
                    <tr key={doc.id} className="border-b border-gray-700 hover:bg-gray-700 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-mono text-blue-400 font-medium">
                          {doc.reference_number}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-white">{doc.city}</td>
                      <td className="px-6 py-4 text-white">{doc.state}</td>
                      <td className="px-6 py-4 text-white">{doc.zip_code}</td>
                      <td className="px-6 py-4">
                        <span className="font-mono text-green-400 font-medium">
                          {formatBalance(doc.balance)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="px-6 py-8 text-center text-gray-400">
                      {searchQuery ? 'No documents found matching your search.' : 'No finance documents available.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <nav className="flex items-center space-x-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 bg-gray-800 border border-gray-700 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-2 text-sm font-medium text-gray-400 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
              </button>
            </nav>
          </div>
        )}

        {/* Info Box */}
        <div className="mt-8 bg-blue-900 bg-opacity-20 border border-blue-700 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="text-blue-400 text-xl">ℹ️</div>
            <div>
              <h3 className="text-blue-400 font-medium mb-2">About Finance Documents</h3>
              <p className="text-gray-300 text-sm">
                These documents contain financial information with sensitive data obscured for security purposes. 
                Only reference numbers, location details, and balance amounts are visible to users. 
                Account numbers and addresses are hidden, and download links are not accessible to regular users.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceDocuments;
