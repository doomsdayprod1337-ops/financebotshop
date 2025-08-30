import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Tickets = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');

  const [newTicket, setNewTicket] = useState({
    title: '',
    description: '',
    category: 'general',
    priority: 'medium'
  });

  const [newReply, setNewReply] = useState({
    message: ''
  });

  const categories = [
    { value: 'technical', label: 'Technical Issue', icon: '🔧' },
    { value: 'billing', label: 'Billing & Payment', icon: '💳' },
    { value: 'account', label: 'Account Issue', icon: '👤' },
    { value: 'general', label: 'General Inquiry', icon: '❓' },
    { value: 'bug_report', label: 'Bug Report', icon: '🐛' },
    { value: 'feature_request', label: 'Feature Request', icon: '💡' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-500' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
    { value: 'high', label: 'High', color: 'bg-orange-500' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-500' }
  ];

  const statuses = [
    { value: 'open', label: 'Open', color: 'bg-blue-500' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-yellow-500' },
    { value: 'waiting_for_user', label: 'Waiting for User', color: 'bg-purple-500' },
    { value: 'resolved', label: 'Resolved', color: 'bg-green-500' },
    { value: 'closed', label: 'Closed', color: 'bg-gray-500' }
  ];

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/tickets', {
        headers: {
          'Authorization': `Bearer ${user?.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTickets(data.tickets || []);
      }
    } catch (error) {
      console.error('Error loading tickets:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createTicket = async (e) => {
    e.preventDefault();
    try {
      console.log('Creating ticket with data:', newTicket);
      console.log('User token:', user?.access_token);
      
      const response = await fetch('/api/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify(newTicket)
      });

      console.log('Response status:', response.status);
      const responseData = await response.text();
      console.log('Response data:', responseData);

      if (response.ok) {
        const data = JSON.parse(responseData);
        console.log('Parsed data:', data);
        setTickets([data.ticket, ...tickets]);
        setNewTicket({
          title: '',
          description: '',
          category: 'general',
          priority: 'medium'
        });
        setShowCreateForm(false);
      } else {
        console.error('Failed to create ticket:', response.status, responseData);
        alert(`Failed to create ticket: ${response.status} - ${responseData}`);
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert(`Error creating ticket: ${error.message}`);
    }
  };

  const addReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !newReply.message.trim()) return;

    try {
      const response = await fetch('/api/ticket-replies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.access_token}`
        },
        body: JSON.stringify({
          ticket_id: selectedTicket.id,
          message: newReply.message
        })
      });

      if (response.ok) {
        const data = await response.json();
        // Reload the selected ticket to get updated replies
        const ticketResponse = await fetch(`/api/tickets?id=${selectedTicket.id}`, {
          headers: {
            'Authorization': `Bearer ${user?.access_token}`
          }
        });
        
        if (ticketResponse.ok) {
          const ticketData = await ticketResponse.json();
          setSelectedTicket(ticketData.ticket);
          setTickets(tickets.map(t => t.id === selectedTicket.id ? ticketData.ticket : t));
        }
        
        setNewReply({ message: '' });
      }
    } catch (error) {
      console.error('Error adding reply:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusObj = statuses.find(s => s.value === status);
    return statusObj ? statusObj.color : 'bg-gray-500';
  };

  const getPriorityColor = (priority) => {
    const priorityObj = priorities.find(p => p.value === priority);
    return priorityObj ? priorityObj.color : 'bg-gray-500';
  };

  const getCategoryIcon = (category) => {
    const categoryObj = categories.find(c => c.value === category);
    return categoryObj ? categoryObj.icon : '❓';
  };

  const filteredTickets = tickets.filter(ticket => {
    if (filterStatus !== 'all' && ticket.status !== filterStatus) return false;
    if (filterCategory !== 'all' && ticket.category !== filterCategory) return false;
    if (filterPriority !== 'all' && ticket.priority !== filterPriority) return false;
    return true;
  });

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
          <h1 className="text-4xl font-bold text-white mb-2">💬 Support Tickets</h1>
          <p className="text-gray-400">Get help with your account, services, or report issues</p>
        </div>

        {/* Create Ticket Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            {showCreateForm ? 'Cancel' : 'Create New Ticket'}
          </button>
        </div>

        {/* Create Ticket Form */}
        {showCreateForm && (
          <div className="bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">Create New Ticket</h2>
            <form onSubmit={createTicket} className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-2">Title</label>
                <input
                  type="text"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  placeholder="Brief description of your issue"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-2">Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  rows="4"
                  placeholder="Detailed description of your issue or question"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-300 mb-2">Category</label>
                  <select
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {categories.map(category => (
                      <option key={category.value} value={category.value}>
                        {category.icon} {category.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-2">Priority</label>
                  <select
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {priorities.map(priority => (
                      <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Create Ticket
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-gray-300 text-sm mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                {statuses.map(status => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.icon} {category.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-gray-300 text-sm mb-1">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Priorities</option>
                {priorities.map(priority => (
                  <option key={priority.value} value={priority.value}>
                    {priority.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Tickets List */}
        <div className="space-y-4">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-gray-800 rounded-lg p-6 hover:bg-gray-700 transition-all duration-200 cursor-pointer border border-gray-700 hover:border-blue-500"
              onClick={() => setSelectedTicket(ticket)}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-white mb-2">{ticket.title}</h3>
                  <p className="text-gray-400 text-sm line-clamp-2">{ticket.description}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(ticket.status)}`}>
                    {statuses.find(s => s.value === ticket.status)?.label || ticket.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(ticket.priority)}`}>
                    {priorities.find(p => p.value === ticket.priority)?.label || ticket.priority}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center">
                    <span className="mr-2">{getCategoryIcon(ticket.category)}</span>
                    {categories.find(c => c.value === ticket.category)?.label || ticket.category}
                  </span>
                  <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                  {ticket.updated_at && (
                    <span>Updated: {new Date(ticket.updated_at).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="text-right">
                  <span className="text-blue-400">Click to view details</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTickets.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-2xl font-semibold text-gray-300 mb-2">No Tickets Found</h3>
            <p className="text-gray-500">
              {tickets.length === 0 
                ? "You haven't created any support tickets yet." 
                : "No tickets match your current filters."}
            </p>
          </div>
        )}
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">{selectedTicket.title}</h2>
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getStatusColor(selectedTicket.status)}`}>
                      {statuses.find(s => s.value === selectedTicket.status)?.label || selectedTicket.status}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getPriorityColor(selectedTicket.priority)}`}>
                      {priorities.find(p => p.value === selectedTicket.priority)?.label || selectedTicket.priority}
                    </span>
                    <span className="flex items-center text-gray-400">
                      <span className="mr-2">{getCategoryIcon(selectedTicket.category)}</span>
                      {categories.find(c => c.value === selectedTicket.category)?.label || selectedTicket.category}
                    </span>
                  </div>
                  <p className="text-gray-400">Created: {new Date(selectedTicket.created_at).toLocaleString()}</p>
                </div>
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Ticket Description */}
              <div className="bg-gray-700 rounded-lg p-4 mb-6">
                <h4 className="text-lg font-semibold text-white mb-3">Description</h4>
                <p className="text-gray-300 whitespace-pre-wrap">{selectedTicket.description}</p>
              </div>

              {/* Replies */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-white mb-4">Conversation</h4>
                <div className="space-y-4">
                  {selectedTicket.replies?.map((reply) => (
                    <div
                      key={reply.id}
                      className={`p-4 rounded-lg ${
                        reply.is_admin_reply ? 'bg-blue-900 border-l-4 border-blue-500' : 'bg-gray-700'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {reply.user?.full_name || reply.user?.email || 'Unknown User'}
                          </span>
                          {reply.is_admin_reply && (
                            <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">Admin</span>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {new Date(reply.created_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-gray-300 whitespace-pre-wrap">{reply.message}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add Reply Form */}
              <div className="bg-gray-700 rounded-lg p-4">
                <h4 className="text-lg font-semibold text-white mb-3">Add Reply</h4>
                <form onSubmit={addReply} className="space-y-4">
                  <textarea
                    value={newReply.message}
                    onChange={(e) => setNewReply({ message: e.target.value })}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                    rows="3"
                    placeholder="Type your message here..."
                    required
                  />
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Send Reply
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewReply({ message: '' })}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200"
                    >
                      Clear
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
