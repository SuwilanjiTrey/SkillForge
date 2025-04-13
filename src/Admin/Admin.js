// src/Admin/Admin.js
import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";
import { 
  Users, 
  LogOut, 
  Home, 
  BookOpen, 
  FileText, 
  Video,
  User,
  Eye,
  Shield
} from "lucide-react";
import "../Styles/admin.css"; 

const AdminDashboard = () => {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [activeTab, setActiveTab] = useState("members");
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const db = getFirestore();
        
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch all admins
        const adminsSnapshot = await getDocs(collection(db, "admins"));
        const adminsData = adminsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUsers(usersData);
        setAdmins(adminsData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);
  
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
  
  const filterUsersByRole = (role) => {
    return users.filter(user => user.role === role);
  };
  
  // Calculate statistics for dashboard
  const memberCount = users.filter(user => user.role === "member").length;
  const viewerCount = users.filter(user => user.role === "viewer").length;
  const adminCount = admins.length;
  const totalUsers = memberCount + viewerCount + adminCount;

  // Get active subscriptions
  const activeSubscriptions = users.filter(user => 
    user.role === "member" && new Date(user.subscriptionEnd) > new Date()
  ).length;
  
  return (
    <div className="admin-dashboard">
      <div className="admin-sidebar">
        <div className="admin-logo">
          <Home size={24} />
          <h2>Admin Panel</h2>
        </div>
        <div className="admin-nav">
          <button 
            className={activeNav === "dashboard" ? "active" : ""} 
            onClick={() => setActiveNav("dashboard")}
          >
            <Home size={18} />
            <span>Dashboard</span>
          </button>
          <button 
            className={activeNav === "members" ? "active" : ""} 
            onClick={() => setActiveNav("members")}
          >
            <Users size={18} />
            <span>Manage Members</span>
          </button>
          <button 
            className={activeNav === "courses" ? "active" : ""} 
            onClick={() => setActiveNav("courses")}
          >
            <BookOpen size={18} />
            <span>Manage Courses</span>
          </button>
          <button 
            className={activeNav === "assessments" ? "active" : ""} 
            onClick={() => setActiveNav("assessments")}
          >
            <FileText size={18} />
            <span>Manage Assessments</span>
          </button>
          <button 
            className={activeNav === "live" ? "active" : ""} 
            onClick={() => setActiveNav("live")}
          >
            <Video size={18} />
            <span>Start Live Tutorial</span>
          </button>
        </div>
        <button className="logout-button" onClick={handleLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
      
      <div className="admin-content">
        {/* Dashboard View */}
        {activeNav === "dashboard" && (
          <div>
            <h1>Dashboard Overview</h1>
            
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon members">
                  <User size={24} />
                </div>
                <div className="stat-info">
                  <h3>Members</h3>
                  <p className="stat-value">{memberCount}</p>
                  <p className="stat-detail">{activeSubscriptions} active subscriptions</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon viewers">
                  <Eye size={24} />
                </div>
                <div className="stat-info">
                  <h3>Viewers</h3>
                  <p className="stat-value">{viewerCount}</p>
                  <p className="stat-detail">Potential subscribers</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon admins">
                  <Shield size={24} />
                </div>
                <div className="stat-info">
                  <h3>Admins</h3>
                  <p className="stat-value">{adminCount}</p>
                  <p className="stat-detail">System administrators</p>
                </div>
              </div>
              
              <div className="stat-card">
                <div className="stat-icon total">
                  <Users size={24} />
                </div>
                <div className="stat-info">
                  <h3>Total Users</h3>
                  <p className="stat-value">{totalUsers}</p>
                  <p className="stat-detail">All platform users</p>
                </div>
              </div>
            </div>
            
            <div className="dashboard-tabs">
              <div className="tab-header">
                <button 
                  className={activeTab === "members" ? "active" : ""} 
                  onClick={() => setActiveTab("members")}
                >
                  Members
                </button>
                <button 
                  className={activeTab === "viewers" ? "active" : ""} 
                  onClick={() => setActiveTab("viewers")}
                >
                  Viewers
                </button>
                <button 
                  className={activeTab === "admins" ? "active" : ""} 
                  onClick={() => setActiveTab("admins")}
                >
                  Admins
                </button>
              </div>
              
              {loading ? (
                <div className="loading">Loading users data...</div>
              ) : (
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Name/Email</th>
                        <th>Role</th>
                        {activeTab === "members" && <th>Program</th>}
                        {activeTab === "members" && <th>Year</th>}
                        {activeTab === "members" && <th>Subscription</th>}
                        <th>Created At</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeTab === "members" && filterUsersByRole("member").map(user => (
                        <tr key={user.id}>
                          <td>{user.email}</td>
                          <td><span className="role member">Member</span></td>
                          <td>{user.program || "N/A"}</td>
                          <td>{user.yearOfStudy || "N/A"}</td>
                          <td>
                            {new Date(user.subscriptionEnd) > new Date() 
                              ? `Active until ${new Date(user.subscriptionEnd).toLocaleDateString()}`
                              : "Expired"}
                          </td>
                          <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button className="edit-button">Edit</button>
                          </td>
                        </tr>
                      ))}
                      
                      {activeTab === "viewers" && filterUsersByRole("viewer").map(user => (
                        <tr key={user.id}>
                          <td>{user.email}</td>
                          <td><span className="role viewer">Viewer</span></td>
                          <td colSpan={activeTab === "members" ? 3 : 1}>
                            {new Date(user.createdAt).toLocaleDateString()}
                          </td>
                          <td>
                            <button className="upgrade-button">Upgrade</button>
                          </td>
                        </tr>
                      ))}
                      
                      {activeTab === "admins" && admins.map(admin => (
                        <tr key={admin.id}>
                          <td>{admin.name || admin.email}</td>
                          <td><span className="role admin">Admin</span></td>
                          <td colSpan={activeTab === "members" ? 3 : 1}>
                            {admin.createdAt instanceof Date 
                              ? admin.createdAt.toLocaleDateString()
                              : typeof admin.createdAt === 'object' && admin.createdAt.seconds
                                ? new Date(admin.createdAt.seconds * 1000).toLocaleDateString()
                                : "N/A"}
                          </td>
                          <td>
                            <button className="edit-button">Edit</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Members Management View */}
        {activeNav === "members" && (
          <div className="members-management">
            <h1>Manage Members</h1>
            <p>Detailed member management interface will be implemented later.</p>
          </div>
        )}
        
        {/* Courses Management View */}
        {activeNav === "courses" && (
          <div className="courses-management">
            <h1>Manage Courses</h1>
            <p>Course management interface will be implemented later.</p>
          </div>
        )}
        
        {/* Assessment Management View */}
        {activeNav === "assessments" && (
          <div className="assessments-management">
            <h1>Manage Assessments</h1>
            <p>Assessment management interface will be implemented later.</p>
          </div>
        )}
        
        {/* Live Tutorial View */}
        {activeNav === "live" && (
          <div className="live-tutorial">
            <h1>Start Live Tutorial</h1>
            <p>Live tutorial interface will be implemented later.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;