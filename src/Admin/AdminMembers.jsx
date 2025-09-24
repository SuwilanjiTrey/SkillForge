import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { 
  Users, 
  UserPlus, 
  BookOpen, 
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Search
} from "lucide-react";
import '../Styles/admin.css';

const AdminMembers = () => {
  const [users, setUsers] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);
  const [elevating, setElevating] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [removing, setRemoving] = useState(false);
  
  const db = getFirestore();
  const auth = getAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all users
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch all tutors
        const tutorsSnapshot = await getDocs(collection(db, "tutors"));
        const tutorsData = tutorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch all courses
        const coursesSnapshot = await getDocs(collection(db, "courses"));
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setUsers(usersData);
        setTutors(tutorsData);
        setCourses(coursesData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [db]);

  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Elevate a user to tutor
  const elevateToTutor = async (user) => {
    if (!user) return;
    
    setElevating(true);
    try {
      // Add user to tutors collection
      await setDoc(doc(db, "tutors", user.id), {
        userId: user.id,
        email: user.email,
        displayName: user.displayName || "",
        role: "tutor",
        createdAt: new Date(),
        assignedCourses: []
      });
      
      // Update user role in users collection
      await updateDoc(doc(db, "users", user.id), {
        role: "tutor"
      });
      
      // Update local state
      setTutors([...tutors, {
        id: user.id,
        userId: user.id,
        email: user.email,
        displayName: user.displayName || "",
        role: "tutor",
        createdAt: new Date(),
        assignedCourses: []
      }]);
      
      setSelectedUser(null);
      alert(`Successfully elevated ${user.displayName || user.email} to tutor!`);
    } catch (error) {
      console.error("Error elevating user to tutor:", error);
      alert("Failed to elevate user to tutor. Please try again.");
    } finally {
      setElevating(false);
    }
  };

  // Assign courses to a tutor
  const assignCoursesToTutor = async (tutor) => {
    if (!tutor || selectedCourses.length === 0) return;
    
    setAssigning(true);
    try {
      // Update tutor document with assigned courses
      await updateDoc(doc(db, "tutors", tutor.id), {
        assignedCourses: arrayUnion(...selectedCourses)
      });
      
      // Update local state
      const updatedTutors = tutors.map(t => 
        t.id === tutor.id 
          ? { 
              ...t, 
              assignedCourses: [...(t.assignedCourses || []), ...selectedCourses] 
            } 
          : t
      );
      setTutors(updatedTutors);
      
      setSelectedCourses([]);
      setShowCourseDropdown(false);
      alert(`Successfully assigned courses to ${tutor.displayName || tutor.email}!`);
    } catch (error) {
      console.error("Error assigning courses to tutor:", error);
      alert("Failed to assign courses to tutor. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  // Remove a course from a tutor
  const removeCourseFromTutor = async (tutor, courseId) => {
    if (!tutor || !courseId) return;
    
    setAssigning(true);
    try {
      // Update tutor document by removing the course
      await updateDoc(doc(db, "tutors", tutor.id), {
        assignedCourses: arrayRemove(courseId)
      });
      
      // Update local state
      const updatedTutors = tutors.map(t => 
        t.id === tutor.id 
          ? { 
              ...t, 
              assignedCourses: (t.assignedCourses || []).filter(id => id !== courseId) 
            } 
          : t
      );
      setTutors(updatedTutors);
      
      alert(`Successfully removed course from ${tutor.displayName || tutor.email}!`);
    } catch (error) {
      console.error("Error removing course from tutor:", error);
      alert("Failed to remove course from tutor. Please try again.");
    } finally {
      setAssigning(false);
    }
  };

  // Remove tutor status
  const removeTutorStatus = async (tutor) => {
    if (!tutor || !window.confirm(`Are you sure you want to remove tutor status from ${tutor.displayName || tutor.email}?`)) {
      return;
    }
    
    setRemoving(true);
    try {
      // Remove from tutors collection
      await deleteDoc(doc(db, "tutors", tutor.id));
      
      // Update user role in users collection
      await updateDoc(doc(db, "users", tutor.id), {
        role: "member"
      });
      
      // Update local state
      setTutors(tutors.filter(t => t.id !== tutor.id));
      
      alert(`Successfully removed tutor status from ${tutor.displayName || tutor.email}!`);
    } catch (error) {
      console.error("Error removing tutor status:", error);
      alert("Failed to remove tutor status. Please try again.");
    } finally {
      setRemoving(false);
    }
  };

  // Get course name by ID
  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title || course.name : "Unknown Course";
  };

  // Toggle course selection
  const toggleCourseSelection = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  if (loading) {
    return <div className="loading">Loading members data...</div>;
  }

  return (
    <div className="members-management">
      <h1>Manage Staff</h1>
      
      <div className="admin-section">
        <div className="section-header">
          <h2>Elevate Users to Tutors</h2>
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name/Email</th>
                <th>Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers
                .filter(user => user.role !== "admin" && user.role !== "tutor")
                .map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{user.displayName || "N/A"}</div>
                      <div className="user-email">{user.email}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`role ${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="elevate-button"
                      onClick={() => setSelectedUser(user)}
                      disabled={elevating}
                    >
                      <UserPlus size={16} /> Elevate to Tutor
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {selectedUser && (
          <div className="confirmation-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Confirm Elevation</h3>
                <button 
                  className="close-button"
                  onClick={() => setSelectedUser(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to elevate <strong>{selectedUser.displayName || selectedUser.email}</strong> to tutor?</p>
                <p>This will give them access to manage courses that you assign to them.</p>
              </div>
              <div className="modal-footer">
                <button 
                  className="cancel-button"
                  onClick={() => setSelectedUser(null)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-button"
                  onClick={() => elevateToTutor(selectedUser)}
                  disabled={elevating}
                >
                  {elevating ? "Elevating..." : "Confirm Elevation"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="admin-section">
        <div className="section-header">
          <h2>Manage Tutors</h2>
        </div>
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name/Email</th>
                <th>Assigned Courses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tutors.map(tutor => (
                <tr key={tutor.id}>
                  <td>
                    <div className="user-info">
                      <div className="user-name">{tutor.displayName || "N/A"}</div>
                      <div className="user-email">{tutor.email}</div>
                    </div>
                  </td>
                  <td>
                    <div className="course-tags">
                      {(tutor.assignedCourses || []).length > 0 ? (
                        tutor.assignedCourses.map(courseId => (
                          <div key={courseId} className="course-tag">
                            {getCourseName(courseId)}
                            <button 
                              className="remove-course"
                              onClick={() => removeCourseFromTutor(tutor, courseId)}
                              disabled={assigning}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <span className="no-courses">No courses assigned</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <div className="course-assignment">
                        <button 
                          className="assign-button"
                          onClick={() => {
                            setSelectedTutor(tutor);
                            setShowCourseDropdown(!showCourseDropdown);
                          }}
                        >
                          <BookOpen size={16} /> Assign Courses
                        </button>
                        
                        {selectedTutor?.id === tutor.id && showCourseDropdown && (
                          <div className="course-dropdown">
                            <div className="dropdown-header">
                              <h4>Select Courses</h4>
                              <button 
                                className="close-dropdown"
                                onClick={() => setShowCourseDropdown(false)}
                              >
                                <X size={16} />
                              </button>
                            </div>
                            <div className="course-list">
                              {courses.map(course => (
                                <div 
                                  key={course.id} 
                                  className={`course-item ${selectedCourses.includes(course.id) ? 'selected' : ''}`}
                                  onClick={() => toggleCourseSelection(course.id)}
                                >
                                  <div className="course-checkbox">
                                    {selectedCourses.includes(course.id) && <Check size={16} />}
                                  </div>
                                  <div className="course-name">{course.title || course.name}</div>
                                </div>
                              ))}
                            </div>
                            <div className="dropdown-footer">
                              <button 
                                className="cancel-button"
                                onClick={() => {
                                  setShowCourseDropdown(false);
                                  setSelectedCourses([]);
                                }}
                              >
                                Cancel
                              </button>
                              <button 
                                className="confirm-button"
                                onClick={() => assignCoursesToTutor(tutor)}
                                disabled={selectedCourses.length === 0 || assigning}
                              >
                                {assigning ? "Assigning..." : `Assign ${selectedCourses.length} Course${selectedCourses.length !== 1 ? 's' : ''}`}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <button 
                        className="remove-button"
                        onClick={() => removeTutorStatus(tutor)}
                        disabled={removing}
                      >
                        Remove Tutor
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminMembers;
