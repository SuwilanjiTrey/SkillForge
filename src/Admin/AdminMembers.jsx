// src/components/admin/AdminMembers.jsx
import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs, doc, setDoc, updateDoc, deleteDoc, addDoc, getDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { 
  Users, 
  UserPlus, 
  Crown, 
  Shield, 
  BookOpen,
  X,
  Check,
  Search,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight
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
  const [message, setMessage] = useState({ text: '', type: '' });
  const [treasuryData, setTreasuryData] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(25);
  
  const db = getFirestore();
  const auth = getAuth();

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData = usersSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const tutorsSnapshot = await getDocs(collection(db, "tutors"));
        const tutorsData = tutorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        const coursesSnapshot = await getDocs(collection(db, "courses"));
        const coursesData = coursesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // Fetch treasury data
        const treasuryDoc = await getDoc(doc(db, "treasury", "main"));
        if (treasuryDoc.exists()) {
          setTreasuryData(treasuryDoc.data());
        }
        
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

  // Changed to search by email instead of name
  const filteredUsers = users.filter(user => 
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  // Function to create a new document in a collection
  const createDoc = async (collectionPath, docId, data) => {
    try {
      const docRef = doc(db, collectionPath, docId);
      await setDoc(docRef, data);
      return { success: true, id: docId };
    } catch (error) {
      console.error(`Error creating document in ${collectionPath}:`, error);
      return { success: false, error: error.message };
    }
  };

  // Function to add a document to a collection with auto-generated ID
  const addDocToCollection = async (collectionPath, data) => {
    try {
      const collectionRef = collection(db, collectionPath);
      const docRef = await addDoc(collectionRef, data);
      return { success: true, id: docRef.id };
    } catch (error) {
      console.error(`Error adding document to ${collectionPath}:`, error);
      return { success: false, error: error.message };
    }
  };

  // Function to update a document
  const updateDocument = async (collectionPath, docId, data) => {
    try {
      const docRef = doc(db, collectionPath, docId);
      await updateDoc(docRef, data);
      return { success: true };
    } catch (error) {
      console.error(`Error updating document in ${collectionPath}:`, error);
      return { success: false, error: error.message };
    }
  };

  // Function to delete a document
  const deleteDocument = async (collectionPath, docId) => {
    try {
      const docRef = doc(db, collectionPath, docId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (error) {
      console.error(`Error deleting document from ${collectionPath}:`, error);
      return { success: false, error: error.message };
    }
  };

  // Function to elevate a user
  const elevateUser = async (user, newRole) => {
    setElevating(true);
    try {
      // Calculate subscription end date (1 month from now)
      const subscriptionEnd = new Date();
      subscriptionEnd.setMonth(subscriptionEnd.getMonth() + 1);
      
      // Get amount from treasury data
      const amount = treasuryData?.roleAmounts?.[newRole] || 0;
      
      // 1. Update user role and subscription in users collection
      const userUpdateResult = await updateDocument("users", user.id, {
        role: newRole,
        subscriptionStatus: 'active',
        subscriptionEnd: subscriptionEnd
      });
      
      if (!userUpdateResult.success) {
        throw new Error(`Failed to update user: ${userUpdateResult.error}`);
      }
      
      // 2. Handle role-specific collections
      if (newRole === 'admin') {
        // Add to admins collection
        const adminCreateResult = await createDoc("admins", user.id, {
          role: 'admin',
          createdAt: new Date()
        });
        
        if (!adminCreateResult.success) {
          throw new Error(`Failed to create admin document: ${adminCreateResult.error}`);
        }
        
        // Remove from tutors if exists
        if (tutors.some(t => t.id === user.id)) {
          await deleteDocument("tutors", user.id);
        }
      } else if (newRole === 'tutor') {
        // Add to tutors collection - Fixed: Ensure displayName is included
        const tutorCreateResult = await createDoc("tutors", user.id, {
          role: 'tutor',
          createdAt: new Date(),
          assignedCourses: [],
          displayName: user.displayName || user.email.split('@')[0] // Use displayName or fallback to email username
        });
        
        if (!tutorCreateResult.success) {
          throw new Error(`Failed to create tutor document: ${tutorCreateResult.error}`);
        }
        
        // Remove from admins if exists
        if (users.some(u => u.role === 'admin' && u.id === user.id)) {
          await deleteDocument("admins", user.id);
        }
      }
      
      // 3. Create transaction document
      const transactionData = {
        userId: user.id,
        userEmail: user.email,
        type: 'elevation',
        role: newRole,
        amount: amount,
        currency: treasuryData?.currency || 'K',
        date: new Date(),
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        description: `Elevated to ${newRole}`,
        category: 'elevation',
        referenceId: user.id,
        createdBy: auth.currentUser?.uid || 'system',
        status: 'completed',
        notes: `User elevated from ${user.role} to ${newRole}`
      };
      
      const transactionResult = await addDocToCollection("transactions", transactionData);
      
      if (!transactionResult.success) {
        throw new Error(`Failed to create transaction: ${transactionResult.error}`);
      }
      
      // 4. Update treasury balance and metadata
      if (treasuryData) {
        const newBalance = treasuryData.balance + amount;
        const newTotalTransactions = (treasuryData.totalTransactions || 0) + 1;
        const newTotalIncome = (treasuryData.totalIncome || 0) + amount;
        
        const treasuryUpdateResult = await updateDocument("treasury", "main", {
          balance: newBalance,
          totalTransactions: newTotalTransactions,
          totalIncome: newTotalIncome,
          updatedAt: new Date(),
          lastUpdatedBy: auth.currentUser?.uid || 'system'
        });
        
        if (!treasuryUpdateResult.success) {
          throw new Error(`Failed to update treasury: ${treasuryUpdateResult.error}`);
        }
        
        // Update local treasury data
        setTreasuryData({
          ...treasuryData,
          balance: newBalance,
          totalTransactions: newTotalTransactions,
          totalIncome: newTotalIncome,
          updatedAt: new Date()
        });
      }
      
      // 5. Update local state
      setUsers(users.map(u => 
        u.id === user.id 
          ? { 
              ...u, 
              role: newRole,
              subscriptionStatus: 'active',
              subscriptionEnd: subscriptionEnd
            } 
          : u
      ));
      
      if (newRole === 'tutor') {
        // Fixed: Ensure displayName is properly set when adding to tutors state
        setTutors([...tutors, {
          id: user.id,
          userId: user.id,
          email: user.email,
          displayName: user.displayName || user.email.split('@')[0], // Use displayName or fallback
          role: "tutor",
          createdAt: new Date(),
          assignedCourses: []
        }]);
      }
      
      setMessage({ text: `Successfully elevated ${user.displayName || user.email} to ${newRole}!`, type: 'success' });
      setSelectedUser(null);
    } catch (error) {
      console.error("Error elevating user:", error);
      setMessage({ text: `Error elevating user: ${error.message}`, type: 'error' });
    } finally {
      setElevating(false);
    }
  };

  // Function to deactivate a user
  const deactivateUser = async (user) => {
    if (!user || !window.confirm(`Are you sure you want to deactivate ${user.displayName || user.email}?`)) {
      return;
    }
    
    setRemoving(true);
    try {
      // 1. Update user role and subscription
      const userUpdateResult = await updateDocument("users", user.id, {
        role: 'viewer',
        subscriptionStatus: 'inactive',
        subscriptionEnd: new Date()
      });
      
      if (!userUpdateResult.success) {
        throw new Error(`Failed to update user: ${userUpdateResult.error}`);
      }
      
      // 2. Remove from role-specific collections
      if (user.role === 'admin') {
        await deleteDocument("admins", user.id);
      } else if (user.role === 'tutor') {
        await deleteDocument("tutors", user.id);
      }
      
      // 3. Create transaction document for deactivation
      const transactionData = {
        userId: user.id,
        userEmail: user.email,
        type: 'deactivation',
        role: 'viewer',
        amount: 0,
        currency: treasuryData?.currency || 'K',
        date: new Date(),
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        description: `Deactivated from ${user.role}`,
        category: 'deactivation',
        referenceId: user.id,
        createdBy: auth.currentUser?.uid || 'system',
        status: 'completed',
        notes: `User deactivated from ${user.role} to viewer`
      };
      
      const transactionResult = await addDocToCollection("transactions", transactionData);
      
      if (!transactionResult.success) {
        throw new Error(`Failed to create transaction: ${transactionResult.error}`);
      }
      
      // 4. Update local state
      setUsers(users.map(u => 
        u.id === user.id 
          ? { 
              ...u, 
              role: 'viewer',
              subscriptionStatus: 'inactive',
              subscriptionEnd: new Date()
            } 
          : u
      ));
      
      setTutors(tutors.filter(t => t.id !== user.id));
      
      setMessage({ text: `Successfully deactivated ${user.displayName || user.email}!`, type: 'success' });
    } catch (error) {
      console.error("Error deactivating user:", error);
      setMessage({ text: `Error deactivating user: ${error.message}`, type: 'error' });
    } finally {
      setRemoving(false);
    }
  };

  // Function to assign courses to a tutor
  const assignCoursesToTutor = async (tutor) => {
    if (!tutor || selectedCourses.length === 0) return;
    
    setAssigning(true);
    try {
      // Get current assigned courses
      const currentCourses = tutor.assignedCourses || [];
      
      // Merge current courses with newly selected ones, avoiding duplicates
      const updatedCourses = [...new Set([...currentCourses, ...selectedCourses])];
      
      // Update tutor document
      const tutorUpdateResult = await updateDocument("tutors", tutor.id, {
        assignedCourses: updatedCourses
      });
      
      if (!tutorUpdateResult.success) {
        throw new Error(`Failed to update tutor: ${tutorUpdateResult.error}`);
      }
      
      // Update local state
      const updatedTutors = tutors.map(t => 
        t.id === tutor.id 
          ? { 
              ...t, 
              assignedCourses: updatedCourses
            } 
          : t
      );
      setTutors(updatedTutors);
      
      setSelectedCourses([]);
      setShowCourseDropdown(false);
      setMessage({ text: `Successfully assigned courses to ${tutor.displayName || tutor.email}!`, type: 'success' });
    } catch (error) {
      console.error("Error assigning courses to tutor:", error);
      setMessage({ text: `Error assigning courses to tutor: ${error.message}`, type: 'error' });
    } finally {
      setAssigning(false);
    }
  };

  // Function to remove a course from a tutor
  const removeCourseFromTutor = async (tutor, courseId) => {
    if (!tutor || !courseId) return;
    
    setAssigning(true);
    try {
      // Get current assigned courses
      const currentCourses = tutor.assignedCourses || [];
      
      // Remove the specified course
      const updatedCourses = currentCourses.filter(id => id !== courseId);
      
      // Update tutor document
      const tutorUpdateResult = await updateDocument("tutors", tutor.id, {
        assignedCourses: updatedCourses
      });
      
      if (!tutorUpdateResult.success) {
        throw new Error(`Failed to update tutor: ${tutorUpdateResult.error}`);
      }
      
      // Update local state
      const updatedTutors = tutors.map(t => 
        t.id === tutor.id 
          ? { 
              ...t, 
              assignedCourses: updatedCourses
            } 
          : t
      );
      setTutors(updatedTutors);
      
      setMessage({ text: `Successfully removed course from ${tutor.displayName || tutor.email}!`, type: 'success' });
    } catch (error) {
      console.error("Error removing course from tutor:", error);
      setMessage({ text: `Error removing course from tutor: ${error.message}`, type: 'error' });
    } finally {
      setAssigning(false);
    }
  };

  // Function to get course name by ID
  const getCourseName = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title || course.name : "Unknown Course";
  };

  // Function to toggle course selection
  const toggleCourseSelection = (courseId) => {
    if (selectedCourses.includes(courseId)) {
      setSelectedCourses(selectedCourses.filter(id => id !== courseId));
    } else {
      setSelectedCourses([...selectedCourses, courseId]);
    }
  };

  // Function to open course dropdown
  const openCourseDropdown = (tutor) => {
    setSelectedTutor(tutor);
    // Pre-select courses that are already assigned
    setSelectedCourses(tutor.assignedCourses || []);
    setShowCourseDropdown(true);
  };

  if (loading) {
    return <div className="loading">Loading members data...</div>;
  }

  return (
    <div className="members-management">
      <div className="members-header">
        <h2>Member Management</h2>
        <p>Elevate users to different roles and manage their access levels</p>
      </div>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <Check size={18} /> : <X size={18} />}
          {message.text}
        </div>
      )}
      
      <div className="admin-section">
        <div className="section-header">
          <h3><Users size={18} /> User Management</h3>
          <div className="search-container">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by email..."  // Updated placeholder
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
                <th>User</th>
                <th>Current Role</th>
                <th>Subscription</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map(user => (
                <tr key={user.id}>
                  <td>
                    <div className="user-info">

                      <div className="user-email">{user.email}</div>
                    </div>
                  </td>
                  <td>
                    <span className={`role-badge ${user.role}`}>
                      {user.role === 'admin' && <Crown size={14} />}
                      {user.role === 'tutor' && <BookOpen size={14} />}
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <div className="subscription-info">
                      <span className={`subscription-status ${user.subscriptionStatus}`}>
                        {user.subscriptionStatus}
                      </span>
                      {user.subscriptionEnd && (
                        <div className="subscription-end">
                          <Calendar size={14} />
                          {new Date(user.subscriptionEnd).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {user.role === 'viewer' && (
                        <>
                          <button 
                            className="elevate-button"
                            onClick={() => setSelectedUser(user)}
                            disabled={elevating}
                          >
                            <UserPlus size={16} /> Elevate
                          </button>
                        </>
                      )}
                      
                      {(user.role === 'admin' || user.role === 'tutor' || user.role === 'member') && (
                        <button 
                          className="deactivate-button"
                          onClick={() => deactivateUser(user)}
                          disabled={removing}
                        >
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="pagination-container">
              <button 
                className="pagination-btn" 
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              
              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    // Show current page, first, last, and pages within 1 of current
                    return page === 1 || 
                           page === totalPages || 
                           Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => {
                    // Add ellipsis if there's a gap
                    if (index > 0 && page - array[index - 1] > 1) {
                      return (
                        <span key={`ellipsis-${page}`} className="pagination-ellipsis">
                          ...
                        </span>
                      );
                    }
                    return (
                      <button
                        key={page}
                        className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => paginate(page)}
                      >
                        {page}
                      </button>
                    );
                  })}
              </div>
              
              <button 
                className="pagination-btn" 
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
        
        {selectedUser && (
          <div className="elevation-modal">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Elevate User</h3>
                <button 
                  className="close-button"
                  onClick={() => setSelectedUser(null)}
                >
                  <X size={18} />
                </button>
              </div>
              <div className="modal-body">
                <div className="user-details">
                  <div className="user-name">{selectedUser.displayName || selectedUser.email}</div>
                  <div className="user-email">{selectedUser.email}</div>
                </div>
                
                <div className="elevation-options">
                  <h4>Select Role</h4>
                  <div className="role-options">
                    <div 
                      className="role-option"
                      onClick={() => elevateUser(selectedUser, 'member')}
                    >
                      <div className="role-icon">
                        <Users size={24} />
                      </div>
                      <div className="role-details">
                        <div className="role-name">Member</div>
                        <div className="role-price">
                          <DollarSign size={14} /> 
                          {treasuryData?.roleAmounts?.member || 50}
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="role-option"
                      onClick={() => elevateUser(selectedUser, 'tutor')}
                    >
                      <div className="role-icon">
                        <BookOpen size={24} />
                      </div>
                      <div className="role-details">
                        <div className="role-name">Tutor</div>
                        <div className="role-price">
                          <DollarSign size={14} /> 
                          {treasuryData?.roleAmounts?.tutor || 150}
                        </div>
                      </div>
                    </div>
                    
                    <div 
                      className="role-option"
                      onClick={() => elevateUser(selectedUser, 'admin')}
                    >
                      <div className="role-icon">
                        <Crown size={24} />
                      </div>
                      <div className="role-details">
                        <div className="role-name">Admin</div>
                        <div className="role-price">
                          <DollarSign size={14} /> 
                          {treasuryData?.roleAmounts?.admin || 300}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      <div className="admin-section">
        <div className="section-header">
          <h3><BookOpen size={18} /> Tutor Management</h3>
        </div>
        
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Tutor</th>
                <th>Assigned Courses</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tutors.map(tutor => (
                <tr key={tutor.id}>
                  <td>
                    <div className="user-info">
                     
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
                          onClick={() => openCourseDropdown(tutor)}
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
