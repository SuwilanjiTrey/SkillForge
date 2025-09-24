// src/components/MemberDashboard.jsx
import React, { useEffect, useState } from "react";
import { Navigate, Link, useNavigate } from "react-router-dom"; // Add useNavigate import
import { 
  getFirestore, 
  collection, 
  getDocs, 
  updateDoc,
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  getDoc,
  onSnapshot
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
  X,
  TrendingUp,
  Award,
  BarChart3,
  FileText,
  Video
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
  // Add this state near the top of the component
const [liveTutorialsCount, setLiveTutorialsCount] = useState(0);
// Add this state near the top of the component
const [liveTutorials, setLiveTutorials] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [stats, setStats] = useState({
    coursesCompleted: 0,
    hoursSpent: 0,
    currentStreak: 0,
    achievements: 0
  });
  
  // Fix: Use useNavigate hook instead of Navigate component
  const navigate = useNavigate();

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
        
        // Set up real-time listeners
        setupRealTimeListeners();
        
      } catch (err) {
        console.error("Authentication error:", err);
        setError("Failed to verify membership. Please log in again.");
        setLoading(false);
      }
    };

// Update the setupRealTimeListeners function
//update the setupRealTimeListeners function to fetch live tutorials
const setupRealTimeListeners = () => {
  const db = getFirestore();
  
  // Real-time notifications listener
  const notificationsRef = collection(db, "notifications");
  const notificationsQuery = query(
    notificationsRef,
    where("userId", "==", userId),
    orderBy("timestamp", "desc"),
    limit(10)
  );
  
  const unsubscribeNotifications = onSnapshot(notificationsQuery, (snapshot) => {
    const notificationsData = [];
    snapshot.forEach(doc => {
      notificationsData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    setNotifications(notificationsData);
  });
  
  // Real-time live sessions listener
  const sessionsRef = collection(db, "liveSessions");
  const now = new Date().getTime();
  const sessionsQuery = query(
    sessionsRef,
    where("timestamp", ">", now),
    where("active", "==", true),
    orderBy("timestamp", "asc"),
    limit(1)
  );
  
  const unsubscribeSessions = onSnapshot(sessionsQuery, (snapshot) => {
    if (!snapshot.empty) {
      setUpcomingSession({
        id: snapshot.docs[0].id,
        ...snapshot.docs[0].data()
      });
    } else {
      setUpcomingSession(null);
    }
  });
  
  // Real-time live tutorials listener
  const liveTutorialsQuery = query(
    sessionsRef,
    where("status", "==", "live")
  );
  
  const unsubscribeLiveTutorials = onSnapshot(liveTutorialsQuery, (snapshot) => {
    const liveTutorialsData = [];
    snapshot.forEach(doc => {
      liveTutorialsData.push({
        id: doc.id,
        ...doc.data()
      });
    });
    setLiveTutorials(liveTutorialsData);
    setLiveTutorialsCount(liveTutorialsData.length);
  });
  
  // Real-time user activity listener
  const userRef = doc(db, "users", userId);
  const unsubscribeUser = onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const userData = doc.data();
      setStats({
        coursesCompleted: userData.coursesCompleted || 0,
        hoursSpent: userData.hoursSpent || 0,
        currentStreak: userData.currentStreak || 0,
        achievements: userData.achievements || 0
      });
      
      // Update recent activity
      if (userData.recentActivity) {
        setRecentActivity(userData.recentActivity);
      }
    }
  });
  
  // Cleanup listeners on unmount
  return () => {
    unsubscribeNotifications();
    unsubscribeSessions();
    unsubscribeLiveTutorials();
    unsubscribeUser();
  };
};

      


    const fetchDashboardData = async (courseDataService) => {
      try {
        await courseDataService.fetchCourses();
        setCourses(courseDataService.getRecentCourses(3));
        
        if (courseDataService.getError()) {
          console.warn("Course fetch warning:", courseDataService.getError());
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

  const markNotificationAsRead = async (notificationId) => {
    try {
      const db = getFirestore();
      const notificationRef = doc(db, "notifications", notificationId);
      await updateDoc(notificationRef, { read: true });
      
      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, read: true } : notif
        )
      );
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle size={16} className="notification-icon success" />;
      case 'warning': return <AlertCircle size={16} className="notification-icon warning" />;
      case 'info': return <Info size={16} className="notification-icon info" />;
      case 'session': return <Video size={16} className="notification-icon session" />;
      case 'course': return <BookOpen size={16} className="notification-icon course" />;
      default: return <Info size={16} className="notification-icon" />;
    }
  };

  const handleContinueCourse = (courseId) => {
    navigate(`/course/${courseId}`);
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
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="welcome-section">
          <h1>Welcome back, {userData?.firstName || userData?.email.split('@')[0] || "Member"}!</h1>
          <p>Continue your learning journey with Skillforge Dev Hub</p>
        </div>
        
        <div className="header-controls">
          {/* Live Session Dropdown */}
         <div className="dropdown-container">
  <button 
    className={`header-button live-session-trigger ${liveTutorials.length > 0 ? 'has-session' : ''}`}
    onClick={() => setLiveSessionOpen(!liveSessionOpen)}
  >
    <Calendar size={20} />
    <span>Live Sessions</span>
    {liveTutorials.length > 0 && <div className="notification-badge">{liveTutorials.length}</div>}
    <ChevronDown size={16} className={`chevron ${liveSessionOpen ? 'open' : ''}`} />
  </button>
  
  {liveSessionOpen && (
    <div className="dropdown-menu session-dropdown">
      <div className="dropdown-header">
        <Calendar size={16} />
        <span>Live Tutorials</span>
        {liveTutorials.length > 0 && <span className="live-count">{liveTutorials.length} live now</span>}
      </div>
      
      {liveTutorials.length > 0 ? (
        <div className="live-tutorials-list">
          {liveTutorials.map((tutorial) => (
            <div key={tutorial.id} className="live-tutorial-item">
              <div className="live-tutorial-info">
                <div className="live-tutorial-header">
                  <div className="live-indicator-small">
                    <div className="live-dot"></div>
                    <span>LIVE NOW</span>
                  </div>
                  <h4>{tutorial.title}</h4>
                </div>
                <p className="live-tutorial-description">{tutorial.description}</p>
                <div className="live-tutorial-meta">
                  <div className="tutorial-meta-item">
                    <Users size={14} />
                    <span>{tutorial.hostName}</span>
                  </div>
                  <div className="tutorial-meta-item">
                    <Calendar size={14} />
                    <span>Started: {new Date(tutorial.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="tutorial-meta-item">
                    <Clock size={14} />
                    <span>{tutorial.duration || 'TBD'}</span>
                  </div>
                </div>
              </div>
              <a 
                href={tutorial.meetLink} 
                target="_blank" 
                rel="noopener noreferrer"
                className="join-live-tutorial-btn"
              >
                <Play size={16} />
                Join Now
              </a>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-sessions">
          <Calendar size={24} />
          <p>No live tutorials available</p>
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
		  {upcomingSession && <div className="session-indicator pulse"></div>}
              <ChevronDown size={16} className={`chevron ${liveSessionOpen ? 'open' : ''}`} />
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
                          <small className="notification-time">
                            {new Date(notification.timestamp?.toDate()).toLocaleString()}
                          </small>
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

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <div className="stat-icon">
            <BookOpen size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.coursesCompleted}</h3>
            <p>Courses Completed</p>
          </div>
          <div className="stat-trend">
            <TrendingUp size={16} />
            <span>12%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.hoursSpent}h</h3>
            <p>Learning Hours</p>
          </div>
          <div className="stat-trend">
            <TrendingUp size={16} />
            <span>8%</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <Award size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.currentStreak}</h3>
            <p>Current Streak</p>
          </div>
          <div className="stat-trend">
            <TrendingUp size={16} />
            <span>5 days</span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <h3>{stats.achievements}</h3>
            <p>Achievements</p>
          </div>
          <div className="stat-trend">
            <TrendingUp size={16} />
            <span>3 new</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Courses */}
        <div className="courses-section">
          <div className="section-header">
            <div className="section-title">
              <BookOpen size={24} />
              <h2>Continue Learning</h2>
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
                        <div className="progress-fill" style={{width: `${course.progress || 65}%`}}></div>
                      </div>
                      <span className="progress-text">{course.progress || 65}%</span>
                    </div>
                  </div>
                  <p className="course-description">{course.description || "No description available"}</p>
                  <div className="course-meta">
                    {course.targetYear && <span className="course-year">{course.targetYear}</span>}
                    {course.targetPrograms && <span className="course-program">{course.targetPrograms}</span>}
                  </div>
                  <button 
                    className="continue-btn"
                    onClick={() => handleContinueCourse(course.id)}
                  >
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

        {/* Recent Activity */}
        <div className="activity-section">
          <div className="section-header">
            <div className="section-title">
              <FileText size={24} />
              <h2>Recent Activity</h2>
            </div>
          </div>
          
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.type === 'course' && <BookOpen size={16} />}
                    {activity.type === 'video' && <Video size={16} />}
                    {activity.type === 'quiz' && <BarChart3 size={16} />}
                  </div>
                  <div className="activity-content">
                    <h4>{activity.title}</h4>
                    <p>{activity.description}</p>
                    <small className="activity-time">
                      {new Date(activity.timestamp?.toDate()).toLocaleString()}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-activity">
                <FileText size={24} />
                <p>No recent activity</p>
                <small>Start learning to see your activity here</small>
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
