// App.js
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login'; // Import your login component
import Register from './pages/Register'; // Import your register component
import Dashboard from './pages/Dashboard'; // Import your dashboard or protected page
import Home from './pages/Home';
import ProjectCreate from './pages/ProjectCreate';
import ProjectDetails from './components/ProjectDetails';
import MyProjects from './components/MyProjects';
import CollaborationWorkspace from './pages/CollaborationWorkspace';
import ApplicantsPage from './components/ApplicantsPage';
import Rating from './components/Rating';
import RatingPage from './components/RatingPage';
import TaskDetails from './components/TaskDetails';
import AllUsers from './pages/AllUsers';
import PopularProjects from './components/PopularProjects';
import BrowsePage from './pages/BrowsePage';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken'); // Check for 'authToken'

  // If no token, redirect to login page
  if (!token) {
    return <Navigate to="/login" />;
  }

  // If token exists, render protected component
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        
        {/* Protected route */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/myprojects" 
          element={
            <ProtectedRoute>
              <MyProjects />
            </ProtectedRoute>
          }
        />
        <Route path="/projects/:id" element={<ProjectDetails />} />
        <Route 
          path="/create-project" 
          element={
            <ProtectedRoute>
              <ProjectCreate />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/collab/:taskId"  // Or use an appropriate path as needed
          element={
            <ProtectedRoute>
              <CollaborationWorkspace />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/applicants/:taskId"  // Or use an appropriate path as needed
          element={
            <ProtectedRoute>
              <ApplicantsPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/rate/:taskId"  // Or use an appropriate path as needed
          element={
            <ProtectedRoute>
              <RatingPage />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/status/:taskId"  // Or use an appropriate path as needed
          element={
            <ProtectedRoute>
              <TaskDetails />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/topusers"  // Or use an appropriate path as needed
          element={
            <ProtectedRoute>
              <AllUsers />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/popularprojects"  // Or use an appropriate path as needed
          element={
            <ProtectedRoute>
              <PopularProjects />
            </ProtectedRoute>
          }
        />
        <Route 
          path="/browse"  // Or use an appropriate path as needed
          element={
            <ProtectedRoute>
              <BrowsePage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
