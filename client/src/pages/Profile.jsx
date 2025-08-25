import React from 'react';

const Profile = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">Profile</h1>
      <div className="bg-gray-800 p-8 rounded-lg border border-gray-700 text-center">
        <div className="text-6xl mb-4">👤</div>
        <h3 className="text-lg font-medium text-white mb-2">User Profile</h3>
        <p className="text-gray-400">Manage your Genesis Market account settings</p>
      </div>
    </div>
  );
};

export default Profile;
