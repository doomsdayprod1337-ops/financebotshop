import React, { useState } from 'react';

const Services = () => {
  const [services] = useState([
    {
      id: 1,
      name: 'Carding Service',
      description: 'Professional carding service with high success rate',
      price: 150.00,
      category: 'Fraud',
      status: 'available',
      rating: 4.8,
      reviews: 127
    },
    {
      id: 2,
      name: 'Hacking Service',
      description: 'Custom hacking solutions for various targets',
      price: 500.00,
      category: 'Hacking',
      status: 'available',
      rating: 4.9,
      reviews: 89
    },
    {
      id: 3,
      name: 'DDoS Attack',
      description: 'Distributed denial of service attacks',
      price: 75.00,
      category: 'Attack',
      status: 'available',
      rating: 4.6,
      reviews: 203
    },
    {
      id: 4,
      name: 'Social Engineering',
      description: 'Phishing and social manipulation services',
      price: 200.00,
      category: 'Social',
      status: 'available',
      rating: 4.7,
      reviews: 156
    },
    {
      id: 5,
      name: 'Data Breach',
      description: 'Corporate data extraction and exfiltration',
      price: 1000.00,
      category: 'Espionage',
      status: 'available',
      rating: 4.9,
      reviews: 67
    },
    {
      id: 6,
      name: 'Ransomware',
      description: 'Custom ransomware development and deployment',
      price: 800.00,
      category: 'Malware',
      status: 'available',
      rating: 4.8,
      reviews: 94
    }
  ]);

  const [filters, setFilters] = useState({
    category: '',
    price: '',
    rating: ''
  });

  const filteredServices = services.filter(service => {
    if (filters.category && service.category !== filters.category) return false;
    if (filters.price && service.price > parseFloat(filters.price)) return false;
    if (filters.rating && service.rating < parseFloat(filters.rating)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Services</h1>
      
      {/* Filters */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
            <select
              value={filters.category}
              onChange={(e) => setFilters({...filters, category: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              <option value="Fraud">Fraud</option>
              <option value="Hacking">Hacking</option>
              <option value="Attack">Attack</option>
              <option value="Social">Social Engineering</option>
              <option value="Espionage">Espionage</option>
              <option value="Malware">Malware</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Max Price</label>
            <select
              value={filters.price}
              onChange={(e) => setFilters({...filters, price: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Price</option>
              <option value="100">$100</option>
              <option value="500">$500</option>
              <option value="1000">$1000</option>
              <option value="2000">$2000+</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Min Rating</label>
            <select
              value={filters.rating}
              onChange={(e) => setFilters({...filters, rating: e.target.value})}
              className="w-full bg-gray-700 border border-gray-600 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Any Rating</option>
              <option value="4.0">4.0+</option>
              <option value="4.5">4.5+</option>
              <option value="4.8">4.8+</option>
            </select>
          </div>
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden hover:border-blue-500 transition-colors">
            {/* Service Header */}
            <div className="p-4 border-b border-gray-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                <span className="text-green-400 font-bold">${service.price.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm">{service.category}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${
                  service.status === 'available' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                }`}>
                  {service.status}
                </span>
              </div>
            </div>

            {/* Service Details */}
            <div className="p-4 space-y-3">
              <p className="text-gray-300 text-sm">{service.description}</p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="flex items-center">
                    <span className="text-yellow-400">★</span>
                    <span className="text-white text-sm ml-1">{service.rating}</span>
                  </div>
                  <span className="text-gray-400 text-sm">({service.reviews} reviews)</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-4 bg-gray-700">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
                Order Service
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Info Section */}
      <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">Professional Services</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-300">
          <div>
            <h4 className="font-medium text-white mb-2">What We Offer</h4>
            <p>Reaper Market provides professional services including development, private requests, and more. All services are performed by experienced professionals with high success rates.</p>
          </div>
          <div>
            <h4 className="font-medium text-white mb-2">Quality Guarantee</h4>
            <p>We guarantee the quality of our services. If a service fails to meet expectations, we provide refunds or re-attempts at no additional cost.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
