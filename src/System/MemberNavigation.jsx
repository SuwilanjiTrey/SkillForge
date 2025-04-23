// src/components/NavigationDrawer.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import {
  User,
  FileText,
  Terminal,
  Calculator,
  Settings,
  Menu,
  X,
  LogOut
} from "lucide-react";
import "../Styles/nav.css";

const NavigationDrawer = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
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
    <div className="dashboard-layout">
      {/* Navigation Drawer */}
      <div className={`navigation-drawer ${drawerOpen ? 'open' : 'closed'}`}>
        <div className="drawer-header">
          <h2>SkillForge</h2>
          <button className="close-drawer" onClick={toggleDrawer}>
            <X size={24} />
          </button>
        </div>
        <div className="drawer-content">
          <nav className="drawer-nav">
            <Link to="/dashboard" className="nav-item">
              <User size={20} />
              <span>Dashboard</span>
            </Link>
            <Link to="/papers" className="nav-item">
              <FileText size={20} />
              <span>Past Papers</span>
            </Link>
            <Link to="/compiler" className="nav-item">
              <Terminal size={20} />
              <span>Online Compiler</span>
            </Link>
            <Link to="/math-solver" className="nav-item">
              <Calculator size={20} />
              <span>Math Solver</span>
            </Link>
            <Link to="/settings" className="nav-item">
              <Settings size={20} />
              <span>Settings</span>
            </Link>

            <button className="logout-button" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className={`main-content ${drawerOpen ? 'shifted' : ''}`}>
        <div className="menu-button" onClick={toggleDrawer}>
          <Menu size={24} />
        </div>
        {children}
      </div>
    </div>
  );
};

export default NavigationDrawer;