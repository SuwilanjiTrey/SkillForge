import React, { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  getDoc 
} from "firebase/firestore";
import { 
  BookOpen, 
  Calendar, 
  Bell,
  User,
  ChevronRight
} from "lucide-react";
import "../Styles/Member.css";
import CourseData from "./Course&UserData/courses.jsx"; // Import the CourseData class (adjust path as needed)

const MemberDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Get auth data from localStorage
  const userRole = localStorage.getItem("userRole");
  const userEmail = localStorage.getItem("userEmail");
  const userId = localStorage.getItem("userId");

  useEffect(() => {
    const verifyMembership = async () => {
      if (!userId || !userEmail) {
        setError("User authentication information missing");
        setLoading(false);
        return;
      }
      
      try {
        // Create CourseData instance
        const courseDataService = new CourseData(userId, userEmail);
        
        // Verify user through CourseData class
        const isVerified = await courseDataService.verifyUser();
        
        if (!isVerified) {
          setError(courseDataService.getError() || "Verification failed");
          setLoading(false);
          return;
        }
        
        // Set user data
        setUserData(courseDataService.userData);
        setIsAuthorized(true);
        
        // Fetch dashboard data using the verified courseDataService
        await fetchDashboardData(courseDataService);
        
      } catch (err) {
        console.error("Authentication error:", err);
        setError("Failed to verify membership. Please log in again.");
        setLoading(false);
      }
    };

    const fetchDashboardData = async (courseDataService) => {
      try {
        // Fetch courses based on user's program and year
        await courseDataService.fetchCourses();
        
        // Get first 3 courses
        setCourses(courseDataService.getRecentCourses(3));
        
        // Check if there was an error fetching courses
        if (courseDataService.getError()) {
          console.warn("Course fetch warning:", courseDataService.getError());
        }
        
        // Fetch upcoming live session
        const db = getFirestore();
        const now = new Date().getTime();
        const sessionsRef = collection(db, "liveSessions");
        const sessionsQuery = query(
          sessionsRef,
          where("timestamp", ">", now),
          where("active", "==", true),
          orderBy("timestamp", "asc"),
          limit(1)
        );
        
        try {
          const sessionsSnapshot = await getDocs(sessionsQuery);
          if (!sessionsSnapshot.empty) {
            setUpcomingSession({
              id: sessionsSnapshot.docs[0].id,
              ...sessionsSnapshot.docs[0].data()
            });
          }
        } catch (sessionError) {
          console.log("Error fetching upcoming session:", sessionError);
          // Continue without showing session
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
        setError("Failed to load dashboard data. Please try again later.");
        setLoading(false);
      }
    };

    verifyMembership();
  }, [userId, userEmail]);

  // Redirect if not a member or not authorized
  if (userRole !== "member" || (!loading && !isAuthorized)) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return <div className="loading-container">Loading your dashboard...</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome, {userData?.firstName || userData?.email.split('@')[0] || "Member"}!</h1>
          <p>Continue your learning journey with Skillforge Dev Hub</p>
        </div>
        <div className="user-info">
          <div className="profile-picture">
            {userData?.profilePic ? (
              <img src={userData.profilePic} alt="Profile" />
            ) : (
              <User size={40} />
            )}
          </div>
          <div className="membership-badge">Premium Member</div>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <div className="card-header-left">
              <BookOpen size={24} />
              <h2>My Courses</h2>
              {userData?.program && userData?.yearOfStudy && (
                <span className="program-badge">{userData.program} - {userData.yearOfStudy}</span>
              )}
            </div>
            <Link to="/courses" className="view-all-button">
              View All Courses
              <ChevronRight size={16} />
            </Link>
          </div>
          <div className="card-content">
            {courses.length > 0 ? (
              <ul className="course-list">
                {courses.map((course) => (
                  <li key={course.id} className="course-item">
                    <h3>{course.title || "Untitled Course"}</h3>
                    <p>{course.description || "No description available"}</p>
                    <div className="course-meta">
                      {course.targetYear && <span className="course-year">{course.targetYear}</span>}
                      {course.targetPrograms && <span className="course-program">{course.targetPrograms}</span>}
                    </div>
                    <button className="course-button">Continue Learning</button>
                  </li>
                ))}
              </ul>
            ) : (
              <p>No courses available for your program and year of study.</p>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <Calendar size={24} />
            <h2>Upcoming Live Session</h2>
          </div>
          <div className="card-content">
            {upcomingSession ? (
              <div className="session-details">
                <h3>{upcomingSession.title}</h3>
                <p>{upcomingSession.description}</p>
                <p className="session-time">
                  {new Date(upcomingSession.timestamp).toLocaleString()}
                </p>
                <a 
                  href={upcomingSession.link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="session-button"
                >
                  Join Session
                </a>
              </div>
            ) : (
              <p>No upcoming live sessions scheduled.</p>
            )}
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <Bell size={24} />
            <h2>Notifications</h2>
          </div>
          <div className="card-content">
            <p>No new notifications.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberDashboard;