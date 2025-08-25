import React from 'react';

const Purchases = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Purchases</h1>
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
        <div className="text-6xl mb-4">💵</div>
        <h3 className="text-lg font-medium text-white mb-2">Purchase History</h3>
        <p className="text-gray-400">View your bot purchase history and downloads</p>
      </div>
    </div>
  );
};

export default Purchases;
