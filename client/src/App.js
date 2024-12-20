import logo from './logo.svg';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserProvider } from './Components/Dashboard/UserProvider';
import './App.css';
import Login from './Components/Login/Login';
import Dashboard from './Components/Dashboard/Dashboard';

function App() {
  return (
    <UserProvider>
    <Router>
    <div className="App">
      <Routes>
        {/* Route for login */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" />} /> {/* Redirect to dashboard by default */}
        {/* Route for dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* Default route - if no path matches, redirect to login */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  </Router>
  </UserProvider>
  );
}

export default App;
