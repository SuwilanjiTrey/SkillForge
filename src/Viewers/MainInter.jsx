// src/components/ViewerDashboard.jsx
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getFirestore, collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { Code, BookOpen, Star, ArrowRight, Zap } from "lucide-react";
import "../Styles/Viewer.css"; // You'll need to create this CSS file

const ViewerDashboard = () => {
  const [freeCourses, setFreeCourses] = useState([]);
  const [popularCourses, setPopularCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Check if user has viewer role
  const userRole = localStorage.getItem("userRole");
  const userEmail = localStorage.getItem("userEmail");

  useEffect(() => {
    const fetchViewerData = async () => {
      try {
        setLoading(true);
        const db = getFirestore();
        
        // Fetch free courses
        const coursesRef = collection(db, "courses");
        const freeCoursesQuery = query(
          coursesRef, 
          where("isFree", "==", true),
          orderBy("createdAt", "desc"),
          limit(3)
        );
        
        try {
          const freeCoursesSnapshot = await getDocs(freeCoursesQuery);
          const freeCoursesData = [];
          freeCoursesSnapshot.forEach((doc) => {
            freeCoursesData.push({ id: doc.id, ...doc.data() });
          });
          setFreeCourses(freeCoursesData);
        } catch (freeCourseError) {
          console.log("Error fetching free courses:", freeCourseError);
          // Continue without showing free courses
        }
        
        // Fetch popular courses
        const popularCoursesQuery = query(
          coursesRef,
          orderBy("viewCount", "desc"),
          limit(2)
        );
        
        try {
          const popularCoursesSnapshot = await getDocs(popularCoursesQuery);
          const popularCoursesData = [];
          popularCoursesSnapshot.forEach((doc) => {
            popularCoursesData.push({ id: doc.id, ...doc.data() });
          });
          setPopularCourses(popularCoursesData);
        } catch (popularCourseError) {
          console.log("Error fetching popular courses:", popularCourseError);
          // Continue without showing popular courses
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching viewer data:", err);
        setError("Failed to load content. Please try again later.");
        setLoading(false);
      }
    };

    fetchViewerData();
  }, [userEmail]);

  // Redirect if not a viewer
  if (userRole !== "viewer") {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return <div className="loading-container">Loading content...</div>;
  }

  return (
    <div className="viewer-container">
      <div className="viewer-header">
        <h1>Welcome to Skillforge Dev Hub</h1>
        <p>Explore our free content and upgrade to access premium features</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="upgrade-banner">
        <div className="banner-content">
          <Zap size={32} className="banner-icon" />
          <div className="banner-text">
            <h2>Unlock Premium Content</h2>
            <p>Get access to live sessions, project reviews, and premium tutorials</p>
          </div>
          <button className="upgrade-button">Upgrade Now</button>
        </div>
      </div>

      <div className="content-section">
        <div className="section-header">
          <BookOpen size={24} />
          <h2>Free Courses</h2>
        </div>
        <div className="courses-grid">
          {freeCourses.length > 0 ? (
            freeCourses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-image">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} />
                  ) : (
                    <div className="placeholder-image">
                      <Code size={48} />
                    </div>
                  )}
                </div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                  <button className="start-course-button">
                    Start Learning <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No free courses available currently.</p>
          )}
        </div>
      </div>

      <div className="content-section">
        <div className="section-header">
          <Star size={24} />
          <h2>Popular Courses</h2>
          <span className="premium-tag">Premium</span>
        </div>
        <div className="premium-courses-grid">
          {popularCourses.length > 0 ? (
            popularCourses.map((course) => (
              <div key={course.id} className="premium-course-card">
                <div className="locked-overlay">
                  <div className="lock-icon">🔒</div>
                  <span>Premium Content</span>
                </div>
                <div className="course-image">
                  {course.imageUrl ? (
                    <img src={course.imageUrl} alt={course.title} />
                  ) : (
                    <div className="placeholder-image">
                      <Code size={48} />
                    </div>
                  )}
                </div>
                <div className="course-info">
                  <h3>{course.title}</h3>
                  <p>{course.description}</p>
                </div>
              </div>
            ))
          ) : (
            <p>No popular courses available currently.</p>
          )}
        </div>
      </div>

      <div className="subscription-options">
        <h2>Ready to take your skills to the next level?</h2>
        <div className="plans">
          <div className="plan-card">
            <h3>Monthly Plan</h3>
            <div className="price">$19.99<span>/month</span></div>
            <ul className="features">
              <li>Access all premium courses</li>
              <li>Weekly live coding sessions</li>
              <li>Project feedback</li>
              <li>Private community access</li>
            </ul>
            <button className="plan-button">Get Started</button>
          </div>
          <div className="plan-card featured">
            <div className="best-value">Best Value</div>
            <h3>Annual Plan</h3>
            <div className="price">$199.99<span>/year</span></div>
            <div className="savings">Save $40</div>
            <ul className="features">
              <li>All monthly plan features</li>
              <li>Priority support</li>
              <li>Exclusive workshops</li>
              <li>Certificate of completion</li>
            </ul>
            <button className="plan-button">Choose Plan</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewerDashboard;