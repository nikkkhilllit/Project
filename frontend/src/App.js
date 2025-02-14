import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import ProjectCreate from './pages/ProjectCreate';
import ProjectDetails from './components/ProjectDetails';
import MyProjects from './components/MyProjects';
import CollaborationWorkspace from './pages/CollaborationWorkspace';
import ApplicantsPage from './components/ApplicantsPage';
import RatingPage from './components/RatingPage';
import TaskDetails from './components/TaskDetails';
import BrowsePage from './pages/BrowsePage';
import UsersDashboard from './components/UsersDashboard';

const isAuthenticated = () => !!localStorage.getItem('authToken');

// Protect routes from unauthenticated users
const ProtectedRoute = ({ children }) => {
  return isAuthenticated() ? children : <Navigate to="/" />;
};

// Redirect logged-in users from login/register
const PublicRoute = ({ children }) => {
  return isAuthenticated() ? <Navigate to="/" /> : children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Protected Routes */}
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/myprojects" element={<ProtectedRoute><MyProjects /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProtectedRoute><ProjectDetails /></ProtectedRoute>} />
        <Route path="/create-project" element={<ProtectedRoute><ProjectCreate /></ProtectedRoute>} />
        <Route path="/collab/:taskId" element={<ProtectedRoute><CollaborationWorkspace /></ProtectedRoute>} />
        <Route path="/applicants/:taskId" element={<ProtectedRoute><ApplicantsPage /></ProtectedRoute>} />
        <Route path="/rate/:taskId" element={<ProtectedRoute><RatingPage /></ProtectedRoute>} />
        <Route path="/status/:taskId" element={<ProtectedRoute><TaskDetails /></ProtectedRoute>} />
        <Route path="/browse" element={<ProtectedRoute><BrowsePage /></ProtectedRoute>} />
        <Route path="/usersdashboard/:id" element={<ProtectedRoute><UsersDashboard /></ProtectedRoute>} />

        {/* Redirect unknown routes to Home */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
