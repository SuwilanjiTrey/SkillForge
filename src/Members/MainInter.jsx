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
  ChevronRight,
  ChevronDown,
  Play,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  X
} from "lucide-react";
import "../Styles/maininter.css";
import CourseData from "./Course&UserData/courses.jsx";
import "../Styles/loading.css";

const MemberDashboard = () => {
  const [userData, setUserData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [upcomingSession, setUpcomingSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [liveSessionOpen, setLiveSessionOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Course Completed',
      message: 'You completed "Introduction to React"',
      time: '2 hours ago',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'New Course Available',
      message: 'Advanced JavaScript is now available',
      time: '1 day ago',
      read: false
    },
    {
      id: 3,
      type: 'warning',
      title: 'Assignment Due',
      message: 'Database assignment due in 2 days',
      time: '2 days ago',
      read: true
    }
  ]);

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
        const courseDataService = new CourseData(userId, userEmail);
        const isVerified = await courseDataService.verifyUser();
        
        if (!isVerified) {
          setError(courseDataService.getError() || "Verification failed");
          setLoading(false);
          return;
        }
        
        setUserData(courseDataService.userData);
        setIsAuthorized(true);
        await fetchDashboardData(courseDataService);
        
      } catch (err) {
        console.error("Authentication error:", err);
        setError("Failed to verify membership. Please log in again.");
        setLoading(false);
      }
    };

    const fetchDashboardData = async (courseDataService) => {
      try {
        await courseDataService.fetchCourses();
        setCourses(courseDataService.getRecentCourses(3));
        
        if (courseDataService.getError()) {
          console.warn("Course fetch warning:", courseDataService.getError());
        }
        
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

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="notification-icon success" />;
      case 'warning': return <AlertCircle size={16} className="notification-icon warning" />;
      case 'info': return <Info size={16} className="notification-icon info" />;
      default: return <Info size={16} className="notification-icon" />;
    }
  };

  if (userRole !== "member" || (!loading && !isAuthorized)) {
    return <Navigate to="/login" replace />;
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {userData?.firstName || userData?.email.split('@')[0] || "Member"}!</h1>
          <p>Continue your learning journey with Skillforge Dev Hub</p>
        </div>
        
        <div className="header-controls">

          {/* Live Session Dropdown */}
          <div className="dropdown-container">
            <button 
              className={`header-button live-session-trigger ${upcomingSession ? 'has-session' : ''}`}
              onClick={() => setLiveSessionOpen(!liveSessionOpen)}
            >
              <Calendar size={20} />
              <span>Live Sessions</span>
              {upcomingSession && <div className="session-indicator"></div>}
              <ChevronDown size={16} className={`chevron ${liveSessionOpen ? 'open' : ''}`} />
            </button>
            
            {liveSessionOpen && (
              <div className="dropdown-menu session-dropdown">
                <div className="dropdown-header">
                  <Calendar size={16} />
                  <span>Upcoming Sessions</span>
                </div>
                
                {upcomingSession ? (
                  <div className="session-item">
                    <div className="session-info">
                      <h4>{upcomingSession.title}</h4>
                      <p>{upcomingSession.description}</p>
                      <div className="session-meta">
                        <div className="session-time">
                          <Clock size={14} />
                          {new Date(upcomingSession.timestamp).toLocaleString()}
                        </div>
                        <div className="session-attendees">
                          <Users size={14} />
                          <span>Join Session</span>
                        </div>
                      </div>
                    </div>
                    <a 
                      href={upcomingSession.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="join-session-btn"
                    >
                      <Play size={16} />
                      Join
                    </a>
                  </div>
                ) : (
                  <div className="no-sessions">
                    <Calendar size={24} />
                    <p>No upcoming live sessions scheduled</p>
                    <small>Check back later for new sessions</small>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notifications Dropdown */}
          <div className="dropdown-container">
            <button 
              className="header-button notification-trigger"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
            >
              <Bell size={20} />
              <span>Notifications</span>
              {unreadCount > 0 && <div className="notification-badge">{unreadCount}</div>}
              <ChevronDown size={16} className={`chevron ${notificationsOpen ? 'open' : ''}`} />
            </button>
            
            {notificationsOpen && (
              <div className="dropdown-menu notification-dropdown">
                <div className="dropdown-header">
                  <Bell size={16} />
                  <span>Notifications</span>
                  {unreadCount > 0 && <span className="unread-count">{unreadCount} new</span>}
                </div>
                
                <div className="notification-list">
                  {notifications.length > 0 ? (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id} 
                        className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                        onClick={() => markNotificationAsRead(notification.id)}
                      >
                        {getNotificationIcon(notification.type)}
                        <div className="notification-content">
                          <h4>{notification.title}</h4>
                          <p>{notification.message}</p>
                          <small className="notification-time">{notification.time}</small>
                        </div>
                        {!notification.read && <div className="unread-dot"></div>}
                      </div>
                    ))
                  ) : (
                    <div className="no-notifications">
                      <Bell size={24} />
                      <p>No notifications yet</p>
                      <small>We'll notify you of important updates</small>
                    </div>
                  )}
                </div>
                
                {notifications.length > 0 && (
                  <div className="dropdown-footer">
                    <button className="view-all-notifications">View All Notifications</button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="user-info">
            <div className="profile-picture">
              {userData?.profilePic ? (
                <img src={userData.profilePic} alt="Profile" />
              ) : (
                <User size={24} />
              )}
            </div>
            <div className="membership-badge">Premium Member</div>
          </div>
        </div>
      </div>

      {error && (
        <div className="error-message">
          <AlertCircle size={16} />
          {error}
        </div>
      )}

      <div className="dashboard-content">
        <div className="courses-section">
          <div className="section-header">
            <div className="section-title">
              <BookOpen size={24} />
              <h2>My Courses</h2>
              {userData?.program && userData?.yearOfStudy && (
                <span className="program-badge">{userData.program} - {userData.yearOfStudy}</span>
              )}
            </div>
            <Link to="/courses" className="view-all-link">
              View All Courses
              <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="courses-grid">
            {courses.length > 0 ? (
              courses.map((course) => (
                <div key={course.id} className="course-card">
                  <div className="course-header">
                    <h3>{course.title || "Untitled Course"}</h3>
                    <div className="course-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{width: '65%'}}></div>
                      </div>
                      <span className="progress-text">65%</span>
                    </div>
                  </div>
                  <p className="course-description">{course.description || "No description available"}</p>
                  <div className="course-meta">
                    {course.targetYear && <span className="course-year">{course.targetYear}</span>}
                    {course.targetPrograms && <span className="course-program">{course.targetPrograms}</span>}
                  </div>
                  <button className="continue-btn">
                    <Play size={16} />
                    Continue Learning
                  </button>
                </div>
              ))
            ) : (
              <div className="no-courses">
                <BookOpen size={48} />
                <h3>No courses available</h3>
                <p>No courses found for your program and year of study.</p>
                <Link to="/courses" className="browse-courses-btn">Browse All Courses</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdowns */}
      {(notificationsOpen || liveSessionOpen) && (
        <div 
          className="dropdown-overlay" 
          onClick={() => {
            setNotificationsOpen(false);
            setLiveSessionOpen(false);
          }}
        ></div>
      )}
    </div>
  );
};

export default MemberDashboard;