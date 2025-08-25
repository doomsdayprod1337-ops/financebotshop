import React, { useState } from 'react';

const Orders = () => {
  const [orders] = useState([
    {
      id: 'ORD-001',
      botId: 'BOT-123',
      country: 'US',
      price: 15.00,
      status: 'completed',
      date: '2024-01-15',
      payment: 'Bitcoin'
    },
    {
      id: 'ORD-002',
      botId: 'BOT-456',
      country: 'GB',
      price: 12.50,
      status: 'pending',
      date: '2024-01-14',
      payment: 'Monero'
    }
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Orders</h1>
      
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Order ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Bot ID</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Country</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Price</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Date</th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-300 uppercase">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-700">
                  <td className="px-6 py-4 text-white font-medium">{order.id}</td>
                  <td className="px-6 py-4 text-blue-400">{order.botId}</td>
                  <td className="px-6 py-4 text-white">{order.country}</td>
                  <td className="px-6 py-4 text-green-400">${order.price}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      order.status === 'completed' ? 'bg-green-500 text-white' : 'bg-yellow-500 text-white'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-300">{order.date}</td>
                  <td className="px-6 py-4 text-gray-300">{order.payment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Orders;
