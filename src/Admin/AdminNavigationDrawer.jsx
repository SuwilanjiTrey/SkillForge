import React from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { getAuth, signOut } from "firebase/auth";

import { 
  Users, 
  LogOut, 
  Home, 
  BookOpen, 
  DollarSign, 
  Video,
  User,
  Eye,
  Shield,
  Settings
} from 'lucide-react';
import '../Styles/admin.css';

const AdminNavigationDrawer = ({ children }) => {
  const location = useLocation();
  
  const navigate = useNavigate();
  
  // Check if the current path is active
  const isActive = (path) => {
    return location.pathname === path;
  };
  
  const handleLogout = async () => {
    try {
      const auth = getAuth();
      await signOut(auth);
      localStorage.removeItem("userRole");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userId");
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };
  
  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <Home size={24} />
          <h2>Admin Panel</h2>
        </div>
        <div className="admin-nav">
          <Link 
            to="/admin" 
            className={`nav-item ${isActive('/admin') ? 'active' : ''}`}
          >
            <Home size={18} />
            <span>Dashboard</span>
          </Link>
          <Link 
            to="/admin/members" 
            className={`nav-item ${isActive('/admin/members') ? 'active' : ''}`}
          >
            <Users size={18} />
            <span>Manage Members</span>
          </Link>
          <Link 
            to="/admin/courses" 
            className={`nav-item ${isActive('/admin/courses') ? 'active' : ''}`}
          >
            <BookOpen size={18} />
            <span>Manage Courses</span>
          </Link>
          
          <Link 
            to="/admin/treasury" 
            className={`nav-item ${isActive('/admin/treasury') ? 'active' : ''}`}
          >
            <DollarSign size={18} />
            <span>Manage Finances</span>
          </Link>
          {/*
          <Link 
            to="/admin/live" 
            className={`nav-item ${isActive('/admin/live') ? 'active' : ''}`}
          >
            <Video size={18} />
            <span>Start Live Tutorial</span>
          </Link>
          
          */}
          <Link 
            to="/adminSettings" 
            className={`nav-item ${isActive('/adminSettings') ? 'active' : ''}`}
          >
            <Settings size={18} />
            <span>Settings</span>
          </Link>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
      
      <div className="admin-content">
        {children}
      </div>
    </div>
  );
};

export default AdminNavigationDrawer;
