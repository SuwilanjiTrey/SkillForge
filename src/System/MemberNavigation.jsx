// src/components/NavigationDrawer.jsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  User,
  FileText,
  Terminal,
  Calculator,
  Settings,
  Menu,
  X
} from "lucide-react";
import "../Styles/nav.css";

const NavigationDrawer = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
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
            <Link to="/past-papers" className="nav-item">
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