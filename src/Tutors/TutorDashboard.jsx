import React, { useState, useEffect } from 'react';
import {
  Users,
  BookOpen,
  Video,
  FileText,
  ArrowRight,
  UserPlus,
  CheckCircle,
  TrendingUp,
  Clock
} from 'lucide-react';
import { getFirestore, collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './styles/Tutorstyles.css';

const TutorDashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    activeTutorials: 0,
    assessments: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tutorData, setTutorData] = useState(null);
  
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const fetchTutorData = async () => {
      try {
        setLoading(true);
        const user = auth.currentUser;
        
        if (!user) {
          setError("User not authenticated");
          setLoading(false);
          return;
        }

        // Get tutor document
        const tutorDocRef = doc(db, "tutors", user.uid);
        const tutorDoc = await getDoc(tutorDocRef);
        
        if (!tutorDoc.exists()) {
          setError("You don't have tutor privileges. Please contact an administrator.");
          setLoading(false);
          return;
        }

        const tutorData = tutorDoc.data();
        setTutorData(tutorData);
        const assignedCourseIds = tutorData.assignedCourses || [];

        // Fetch assigned courses
        const coursesData = [];
        for (const courseId of assignedCourseIds) {
          try {
            const courseDoc = await getDoc(doc(db, "courses", courseId));
            if (courseDoc.exists()) {
              coursesData.push({
                id: courseDoc.id,
                ...courseDoc.data()
              });
            }
          } catch (err) {
            console.error(`Error fetching course ${courseId}:`, err);
            // Continue with other courses even if one fails
          }
        }
        setAssignedCourses(coursesData);

        // Try to fetch additional stats, but don't fail if we can't
        try {
          // Fetch all users to count students
          const usersSnapshot = await getDocs(collection(db, "users"));
          const usersData = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Fetch all assessments
          const assessmentsSnapshot = await getDocs(collection(db, "Assessments"));
          const assessmentsData = assessmentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Fetch all live sessions
          const sessionsSnapshot = await getDocs(collection(db, "liveSessions"));
          const sessionsData = sessionsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));

          // Calculate stats
          const memberUsers = usersData.filter(user => user.role === "member");
          const tutorAssessments = assessmentsData.filter(assessment => 
            assignedCourseIds.includes(assessment.courseId)
          );
          const activeSessions = sessionsData.filter(session => 
            session.active && session.createdBy === user.uid
          );

          setStats({
            students: memberUsers.length,
            courses: assignedCourseIds.length,
            activeTutorials: activeSessions.length,
            assessments: tutorAssessments.length
          });

          // Create recent activity
          const activity = [
            { id: 1, action: `${memberUsers.length} students enrolled`, time: 'Current', icon: <UserPlus size={16} /> },
            { id: 2, action: `${assignedCourseIds.length} courses assigned`, time: 'Current', icon: <BookOpen size={16} /> },
            { id: 3, action: `${activeSessions.length} active tutorials`, time: 'Current', icon: <Video size={16} /> },
            { id: 4, action: `${tutorAssessments.length} assessments created`, time: 'Current', icon: <FileText size={16} /> },
          ];
          setRecentActivity(activity);
        } catch (err) {
          console.error("Error fetching additional stats:", err);
          // Set default stats if we can't fetch them
          setStats({
            students: 0,
            courses: assignedCourseIds.length,
            activeTutorials: 0,
            assessments: 0
          });
          
          // Set basic activity
          const activity = [
            { id: 1, action: `${assignedCourseIds.length} courses assigned`, time: 'Current', icon: <BookOpen size={16} /> },
          ];
          setRecentActivity(activity);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching tutor data:", err);
        setError("Failed to load dashboard data. You may not have the necessary permissions.");
        setLoading(false);
      }
    };

    fetchTutorData();
  }, [db, auth]);

  const quickActions = [
    { title: 'Manage Courses', icon: <BookOpen size={20} />, path: '/tutor/courses' },
    { title: 'Start Tutorial', icon: <Video size={20} />, path: '/tutor/tutorials' },
    { title: 'Create Assessment', icon: <FileText size={20} />, path: '/tutor/assessments' },
  ];

  const handleActionClick = (path) => {
    window.location.href = path;
  };

  if (loading) {
    return <div className="loading-spinner">Loading dashboard...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="retry-button" 
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="tutor-dashboard-header">
        <h1 className="tutor-dashboard-title">Tutor Dashboard</h1>
        <p className="tutor-dashboard-subtitle">Welcome back, {tutorData?.displayName || tutorData?.email || "Tutor"}!</p>
      </div>
      
      {/* Stats Cards */}
      <div className="tutor-stats-grid">
        <div className="tutor-stat-card">
          <div className="tutor-stat-icon-container blue">
            <Users size={24} />
          </div>
          <div className="tutor-stat-content">
            <h3>{stats.students}</h3>
            <p>Students</p>
          </div>
        </div>
        
        <div className="tutor-stat-card">
          <div className="tutor-stat-icon-container green">
            <BookOpen size={24} />
          </div>
          <div className="tutor-stat-content">
            <h3>{stats.courses}</h3>
            <p>Assigned Courses</p>
          </div>
        </div>
        
        <div className="tutor-stat-card">
          <div className="tutor-stat-icon-container purple">
            <Video size={24} />
          </div>
          <div className="tutor-stat-content">
            <h3>{stats.activeTutorials}</h3>
            <p>Active Tutorials</p>
          </div>
        </div>
        
        <div className="tutor-stat-card">
          <div className="tutor-stat-icon-container amber">
            <FileText size={24} />
          </div>
          <div className="tutor-stat-content">
            <h3>{stats.assessments}</h3>
            <p>Assessments</p>
          </div>
        </div>
      </div>
      
      <div className="tutor-content-grid">
        {/* Assigned Courses */}
        <div className="tutor-card">
          <div className="tutor-card-header">
            <h2 className="tutor-card-title">Your Assigned Courses</h2>
          </div>
          <div className="tutor-courses-list">
            {assignedCourses.length > 0 ? (
              assignedCourses.map(course => (
                <div key={course.id} className="tutor-course-item">
                  <div className="tutor-course-title">{course.title}</div>
                  <div className="tutor-course-description">{course.description}</div>
                  <div className="tutor-course-meta">
                    <span className="tutor-course-program">
                      {course.targetPrograms ? course.targetPrograms.join(', ') : 'N/A'}
                    </span>
                    <span className="tutor-course-modules">
                      {course.modules ? course.modules.length : 0} modules
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="tutor-no-courses">
                <p>No courses assigned to you yet. Contact an admin to get courses assigned.</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="tutor-card">
          <div className="tutor-card-header">
            <h2 className="tutor-card-title">Recent Activity</h2>
          </div>
          <ul className="tutor-activity-list">
            {recentActivity.map((activity) => (
              <li key={activity.id} className="tutor-activity-item">
                <div className="tutor-activity-content">
                  {activity.icon}
                  <span style={{ marginLeft: '0.5rem' }}>{activity.action}</span>
                </div>
                <span className="tutor-activity-time">{activity.time}</span>
              </li>
            ))}
          </ul>
        </div>
        
        {/* Quick Actions */}
        <div className="tutor-card">
          <div className="tutor-card-header">
            <h2 className="tutor-card-title">Quick Actions</h2>
          </div>
          <div className="tutor-quick-actions">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleActionClick(action.path)}
                className="tutor-action-btn"
              >
                <div className="tutor-action-content">
                  <div className="tutor-action-icon">
                    {action.icon}
                  </div>
                  <span className="tutor-action-text">
                    {action.title}
                  </span>
                </div>
                <ArrowRight size={18} className="tutor-action-arrow" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;
