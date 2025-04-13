import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import { LogOut, Code, BookOpen } from "lucide-react";
import "./Styles/Home.css"; // We'll create this file next

const HomePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, []);
  
  const handleLogin = async () => {
    
    try {
      
      navigate("/login");
    } catch (error) {
      console.error("Login error:", error);
    }
  };
  
  /**
   * 
   *   const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      localStorage.removeItem("isAdmin");
      navigate("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };
   */

  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  return (
    <div className="home-container">
      <header className="home-header">
        <div className="logo">
          <Code size={28} />
          <h1>Developer Hub</h1>
        </div>
        <nav className="nav-links">
          <a href="#courses" className="nav-link">Courses</a>
          <a href="#resources" className="nav-link">Resources</a>
          <a href="#community" className="nav-link">Community</a>
          
           
          
          <button onClick={handleLogin} className="login-btn">
            <LogOut size={18} />
            <span>Login / Signup</span>
          </button>
        </nav>
      </header>
      
      <main className="home-main">
        <section className="hero-section">
          <div className="hero-content">
            <h1>Welcome to the Developer Hub</h1>
            <p>Master computer science and programming with our curated courses</p>
            <div className="hero-cta">
              <button className="primary-btn">
                <BookOpen size={18} />
                <span>Browse Courses</span>
              </button>
            </div>
          </div>
        </section>
        
        <section id="courses" className="featured-courses">
          <h2>Featured Courses</h2>
          <div className="course-grid">
            {/* Course cards would go here */}
            <div className="course-card">
              <div className="course-badge">Popular</div>
              <h3>Advanced JavaScript</h3>
              <p>Master modern JavaScript concepts and practices</p>
            </div>
            <div className="course-card">
              <div className="course-badge">New</div>
              <h3>React Fundamentals</h3>
              <p>Build powerful web applications with React</p>
            </div>
            <div className="course-card">
              <h3>Data Structures</h3>
              <p>Essential algorithms and data structures</p>
            </div>
          </div>
        </section>
      </main>
      
      <footer className="home-footer">
        <p>&copy; 2025 Developer Hub. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default HomePage;