import React from 'react';
import {
  Users,
  BookOpen,
  Video,
  FileText,
  ArrowRight,
  UserPlus,
  CheckCircle
} from 'lucide-react';
import './styles/Tutorstyles.css';

const TutorDashboard = () => {
  // Mock data - replace with actual data from Firestore
  const stats = {
    students: 42,
    courses: 8,
    activeTutorials: 3,
    assessments: 12
  };

  const recentActivity = [
    { id: 1, action: 'New student enrolled', time: '2 hours ago', icon: <UserPlus size={16} /> },
    { id: 2, action: 'Course "Math 101" updated', time: '1 day ago', icon: <BookOpen size={16} /> },
    { id: 3, action: 'Tutorial session completed', time: '2 days ago', icon: <CheckCircle size={16} /> },
    { id: 4, action: 'New assessment created', time: '3 days ago', icon: <FileText size={16} /> },
  ];

  const quickActions = [
    { title: 'Manage Courses', icon: <BookOpen size={20} />, path: '/tutor/courses' },
    { title: 'Start Tutorial', icon: <Video size={20} />, path: '/tutor/tutorials' },
    { title: 'Create Assessment', icon: <FileText size={20} />, path: '/tutor/assessments' },
  ];

  const handleActionClick = (path) => {
    window.location.href = path;
  };

  return (
    <div>
      <div className="tutor-dashboard-header">
        <h1 className="tutor-dashboard-title">Tutor Dashboard</h1>
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
            <p>Courses</p>
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
