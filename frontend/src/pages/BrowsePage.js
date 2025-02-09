import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import PopularProjects from '../components/PopularProjects';
import AllUsers from './AllUsers';

const BrowsePage = () => {
  // 'projects' tab is active by default
  const [activeTab, setActiveTab] = useState('projects');

  return (
    <div className="bg-gray-900 min-h-screen text-white">
      <Navbar />
      <div className="max-w-6xl mx-auto p-6">
        {/* Tab Switch */}
        <div className="flex justify-center mb-8">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2 border-b-2 transition-colors duration-300 ${
              activeTab === 'projects'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent hover:border-gray-500'
            }`}
          >
            Popular Projects
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`ml-4 px-4 py-2 border-b-2 transition-colors duration-300 ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-500'
                : 'border-transparent hover:border-gray-500'
            }`}
          >
            Top Freelancers
          </button>
        </div>

        {/* Render content based on active tab */}
        <div>
          {activeTab === 'projects' && <PopularProjects />}
          {activeTab === 'users' && <AllUsers />}
        </div>
      </div>
    </div>
  );
};

export default BrowsePage;
