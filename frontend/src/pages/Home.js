import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Home = () => {
  return (
    <div>
      <Navbar />
      <main className="container mx-auto text-center py-16">
        <h1 className="text-4xl font-bold mb-6">Welcome to FreelanceHub!</h1>
        <p className="text-lg mb-6">A Decentralized Platform for Collaborative Work</p>
        <a href="/register" className="bg-blue-500 text-white p-3 rounded">Get Started</a>
      </main>
      <Footer />
    </div>
  );
};

export default Home;
