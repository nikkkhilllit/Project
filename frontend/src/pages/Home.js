import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { FaFilter } from 'react-icons/fa';

const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState('projects'); // "projects" or "users"
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Get the token from localStorage
  const token = localStorage.getItem('authToken');

  // Clear results and reset the "searched" flag whenever the searchType changes
  useEffect(() => {
    setResults([]);
    setHasSearched(false);
  }, [searchType]);

  const handleSearch = async (e) => {
    e.preventDefault();

    // If no search term is provided, show an error and stop.
    if (!searchQuery.trim()) {
      setError("Please enter a search term");
      return;
    }

    setLoading(true);
    setError('');
    setResults([]);
    setHasSearched(false);

    try {
      let response;
      if (searchType === 'projects') {
        response = await axios.post(
          'http://localhost:5000/projects/search',
          { query: searchQuery },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResults(response.data.projects);
      } else {
        response = await axios.post(
          'http://localhost:5000/auth/search-users',
          { query: searchQuery },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResults(response.data.users);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error performing search');
    }
    setLoading(false);
    setHasSearched(true);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center py-16">
        <div className="relative text-center px-6 max-w-2xl space-y-6">
          <h1 className="text-5xl font-bold text-white">Welcome to DevSpace!</h1>
          <p className="text-xl text-gray-300">A Platform for Collaborative Work</p>
          {/* If user is logged in, show search form; otherwise, show a "Let's Start" button */}
          {token ? (
            <form onSubmit={handleSearch} className="mt-6">
              <div className="flex flex-col md:flex-row md:items-center justify-center space-y-4 md:space-y-0 md:space-x-4 relative">
                {/* Filter Icon with Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 rounded-full bg-gray-700 hover:bg-blue-600 transition-colors duration-300"
                  >
                    <FaFilter size={20} className="text-white" />
                  </button>
                  {showDropdown && (
                    <div className="absolute top-full left-0 mt-1 bg-gray-700 rounded shadow-lg z-10">
                      <button
                        type="button"
                        onClick={() => {
                          setSearchType('projects');
                          setResults([]);
                          setShowDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-blue-600"
                      >
                        Projects
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchType('users');
                          setResults([]);
                          setShowDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-blue-600"
                      >
                        Freelancers
                      </button>
                    </div>
                  )}
                </div>
                {/* Search Input */}
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full md:w-80 px-4 py-3 rounded-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  className="w-full md:w-auto bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition duration-300 ease-in-out hover:bg-blue-700"
                >
                  Search
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6">
              <Link
                to="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition duration-300 ease-in-out"
              >
                Let's Start
              </Link>
            </div>
          )}
          {loading && <p className="mt-4">Searching...</p>}
          {error && <p className="mt-4 text-red-500">{error}</p>}
        </div>

        {/* Results Section */}
        {!loading && hasSearched && (
          <div className="mt-12 w-full px-6">
            {results.length > 0 ? (
              searchType === 'projects' ? (
                <>
                  <h2 className="text-4xl font-bold text-center mb-8">Projects</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {results.map((project) => (
                      <div
                        key={project._id}
                        className="bg-gray-800 p-6 rounded-xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-gray-700"
                      >
                        <h2 className="text-2xl font-semibold text-white mb-3">
                          {project.title}
                        </h2>
                        <p className="text-gray-300 mb-2">
                          <span className="font-medium text-gray-400">Description:</span>{' '}
                          {project.description}
                        </p>
                        <p className="text-gray-300 mb-2">
                          <span className="font-medium text-gray-400">Budget:</span>{' '}
                          ${project.budget}
                        </p>
                        <p className="text-gray-300 mb-2">
                          <span className="font-medium text-gray-400">Deadline:</span>{' '}
                          {new Date(project.deadline).toLocaleDateString()}
                        </p>
                        <p className="text-gray-300 mb-2">
                          <span className="font-medium text-gray-400">Likes:</span>{' '}
                          {project.likes ? project.likes.length : 0}
                        </p>
                        <Link
                          to={`/projects/${project._id}`}
                          className="text-blue-500 hover:text-white font-medium mt-4 inline-block"
                        >
                          View Details
                        </Link>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <h2 className="text-4xl font-bold text-center mb-8">Freelancers</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                    {results.map((user) => {
                      const averageRating =
                        user.ratings && user.ratings.length > 0
                          ? user.ratings.reduce((sum, rating) => sum + rating.score, 0) /
                            user.ratings.length
                          : 0;
                      const completedTasks = user.completedTasks || 0;
                      const overdueTasks = user.overdueTasks || 0;
                      const totalTasks = completedTasks + overdueTasks;
                      const onTimeRate =
                        totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(0) : '0';
                      const activeStreak = user.streakDays || 0;
                      return (
                        <div
                          key={user._id}
                          className="bg-gray-800 p-6 rounded-xl shadow-xl transform transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:bg-gray-700"
                        >
                          <h2 className="text-2xl font-semibold mb-3">{user.username}</h2>
                          <p className="text-gray-300 mb-2">
                            <span className="font-medium text-gray-400">Email:</span> {user.email}
                          </p>
                          <div className="mt-2">
                            <p className="text-gray-300 mb-1">
                              <span className="font-medium text-gray-400">Task Completion:</span>{' '}
                              {completedTasks}/{totalTasks}
                            </p>
                            <p className="text-gray-300 mb-1">
                              <span className="font-medium text-gray-400">On Time Rate:</span>{' '}
                              {onTimeRate}% On Time
                            </p>
                            <div className="mt-2">
                              {user.ratings && user.ratings.length > 0 ? (
                                <>
                                  <span className="font-medium text-gray-400">Ratings:</span>{' '}
                                  {Array(Math.floor(averageRating))
                                    .fill(0)
                                    .map((_, i) => (
                                      <span key={`full-${i}`} className="text-yellow-500">
                                        &#9733;
                                      </span>
                                    ))}
                                  {Array(5 - Math.floor(averageRating))
                                    .fill(0)
                                    .map((_, i) => (
                                      <span key={`empty-${i}`} className="text-gray-500">
                                        &#9733;
                                      </span>
                                    ))}
                                  <span className="text-gray-300 ml-2">
                                    ({user.ratings.length})
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span className="font-medium text-gray-400">Ratings:</span>{' '}
                                  {Array(5)
                                    .fill(0)
                                    .map((_, i) => (
                                      <span key={i} className="text-gray-500">
                                        &#9733;
                                      </span>
                                    ))}
                                </>
                              )}
                            </div>
                            <p className="text-gray-300">
                              <span className="font-medium text-gray-400">Active Streak:</span>{' '}
                              {activeStreak} Days 🔥
                            </p>
                          </div>
                          <div className="mt-4">
                            <Link
                              to={`/usersdashboard/${user._id}`}
                              className="bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-all duration-300"
                            >
                              View Profile
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )
            ) : (
              <p className="text-center text-gray-400 mt-8">No results found.</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Home;
