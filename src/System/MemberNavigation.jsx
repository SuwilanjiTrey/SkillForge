// src/components/NavigationDrawer.jsx
import React, { useState, useEffect } from "react";
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
  LogOut,
  Video,
  Brain,
  BookOpen,
  MessageSquare
} from "lucide-react";
import "../Styles/nav.css";
import CourseData from "../Members/Course&UserData/courses.jsx";

const NavigationDrawer = ({ children }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const navigate = useNavigate();

  // Get auth data from localStorage
  const userRole = localStorage.getItem("userRole");
  const userEmail = localStorage.getItem("userEmail");
  const userId = localStorage.getItem("userId");
  
  console.log(`
  user data: ${userRole},
  userEmail: ${userEmail},
  userId: ${userId}
              `)
              
              
    useEffect(() => {
    const verifyMembership = async () => {
      if (!userId || !userEmail) {
        setError("User authentication information missing");
        setLoading(false);
        return;
      }
      
      try {
        const courseDataService = new CourseData(userId, userEmail);
        const isVerified = await courseDataService.verifyUser();
        
        if (!isVerified) {
          setError(courseDataService.getError() || "Verification failed");
          setLoading(false);
          return;
        }
        
        setUserData(courseDataService.userData);
        setIsAuthorized(true);
        
      } catch (err) {
        console.error("Authentication error:", err);
        setError("Failed to verify membership. Please log in again.");
        setLoading(false);
      }
    };
    verifyMembership();
  }, [userId, userEmail]);

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
        
        <div className="user-container">
          <div className="user-infor">
            <div className="profile-picture">
              {userData?.profilePic ? (
                <img src={userData.profilePic} alt="Profile" />
              ) : (
                <User size={24} />
              )}
            </div>
          </div>
          
          <div className="user-data">
            <h3>Hello {userData?.firstName || userData?.email.split('@')[0] || "Member"}!</h3>
          </div>
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
            <Link to="/ai-study" className="nav-item">
              <Brain size={20} />
              <span>AI Study Tools</span>
            </Link>
           
            
            <Link to="/compiler" className="nav-item">
              <Terminal size={20} />
              <span>Online Compiler</span>
            </Link>
            <Link to="/math-solver" className="nav-item">
              <Calculator size={20} />
              <span>Math Solver</span>
            </Link>
            <Link to="/tuitions" className="nav-item">
              <Video size={20} />
              <span>Online Tutorials</span>
            </Link>
            {/* New AI Study Tools Routes */}
            
            
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
