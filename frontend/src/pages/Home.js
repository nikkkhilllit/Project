import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar />
      
      <main className="flex-1 flex items-center justify-center bg-cover bg-center py-16">
        <div className="text-center px-6 max-w-xl space-y-6">
          <h1 className="text-5xl font-bold text-white">Welcome to FreelanceHub!</h1>
          <p className="text-xl text-gray-300">A Decentralized Platform for Collaborative Work</p>
          <a
            href="/dashboard"
            className="inline-block bg-blue-600 text-white py-3 px-6 rounded-lg text-lg font-medium mt-6 transition duration-300 ease-in-out hover:bg-blue-700"
          >
            Get Started
          </a>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;
