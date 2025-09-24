import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Video,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';
import './styles/Tutorstyles.css';

const TutorNavigationDrawer = ({ children }) => {
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/tutor' },
    { text: 'Manage Courses', icon: <BookOpen size={20} />, path: '/tutor/courses' },
    { text: 'Tutorials', icon: <Video size={20} />, path: '/tutor/tutorials' },
    { text: 'Assessments', icon: <FileText size={20} />, path: '/tutor/assessments' },
    { text: 'Settings', icon: <Settings size={20} />, path: '/tutor/settings' },
  ];

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleMobileDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setMobileOpen(false); // Close mobile menu after navigation
  };

  return (
    <div className="tutor-nav-container">
      {/* Mobile Menu Button */}
      <button
        onClick={handleMobileDrawerToggle}
        className="tutor-mobile-menu-btn"
      >
        {mobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Sidebar */}
      {mobileOpen && (
        <>
          <div 
            className="tutor-mobile-overlay open"
            onClick={handleMobileDrawerToggle}
          ></div>
          <div className="tutor-mobile-sidebar open">
            <div className="tutor-sidebar-header">
              <h1 className="tutor-sidebar-title">Tutor Portal</h1>
              <button 
                onClick={handleMobileDrawerToggle}
                className="tutor-toggle-btn"
              >
                <X size={20} />
              </button>
            </div>
            
            <nav className="tutor-nav-menu">
              <ul>
                {menuItems.map((item) => (
                  <li key={item.text} className="tutor-nav-item">
                    <button
                      onClick={() => handleNavigation(item.path)}
                      className={`tutor-nav-link ${
                        location.pathname === item.path ? 'active' : ''
                      }`}
                    >
                      <span className="tutor-nav-icon">{item.icon}</span>
                      <span className="tutor-nav-text">{item.text}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </>
      )}

      {/* Desktop Sidebar */}
      <div 
        className={`tutor-sidebar ${open ? 'expanded' : 'collapsed'}`}
      >
        <div className="tutor-sidebar-header">
          {open && (
            <h1 className="tutor-sidebar-title">Tutor Portal</h1>
          )}
          <button 
            onClick={handleDrawerToggle}
            className="tutor-toggle-btn"
          >
            {open ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          </button>
        </div>
        
        <nav className="tutor-nav-menu">
          <ul>
            {menuItems.map((item) => (
              <li key={item.text} className="tutor-nav-item">
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`tutor-nav-link ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                >
                  <span className="tutor-nav-icon">{item.icon}</span>
                  {open && (
                    <span className="tutor-nav-text">{item.text}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="tutor-main-content">
        {children}
      </div>
    </div>
  );
};

export default TutorNavigationDrawer;
