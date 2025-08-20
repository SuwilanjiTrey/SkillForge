import React, { useState, useEffect } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs, writeBatch } from "firebase/firestore";
import '../Styles/settings.css';

const AdminSettings = () => {
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    role: '',
    subscriptionStatus: '',
    subscriptionEnd: null
  });
  const [users, setUsers] = useState([]);
  const [treasuryBalance, setTreasuryBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [updatedInfo, setUpdatedInfo] = useState({
    displayName: '',
    email: ''
  });

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  // Fetch user data
  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            displayName: data.displayName || '',
            email: user.email,
            role: data.role || 'member',
            subscriptionStatus: data.subscriptionStatus || 'inactive',
            subscriptionEnd: data.subscriptionEnd ? data.subscriptionEnd.toDate().toLocaleDateString() : null
          });
          setUpdatedInfo({
            displayName: data.displayName || '',
            email: user.email
          });
        }
      } catch (error) {
        setMessage({ text: `Error fetching user data: ${error.message}`, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, db]);

  // Fetch all users and treasury data
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Check if user is admin
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        if (!adminDoc.exists()) {
          setMessage({ text: 'You do not have admin privileges', type: 'error' });
          setLoading(false);
          return;
        }
        
        // Fetch all users
        const usersQuery = query(collection(db, 'users'));
        const querySnapshot = await getDocs(usersQuery);
        const usersList = [];
        
        querySnapshot.forEach((doc) => {
          usersList.push({
            id: doc.id,
            ...doc.data()
          });
        });
        
        setUsers(usersList);
        
        // Fetch treasury balance
        const treasuryDoc = await getDoc(doc(db, 'treasury', 'main'));
        if (treasuryDoc.exists()) {
          setTreasuryBalance(treasuryDoc.data().balance || 0);
        }
      } catch (error) {
        setMessage({ text: `Error fetching admin data: ${error.message}`, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, db]);

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    
    if (newPassword.length < 6) {
      setMessage({ text: 'Password should be at least 6 characters', type: 'error' });
      return;
    }
    
    setLoading(true);
    try {
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      setMessage({ text: 'Password updated successfully', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
    } catch (error) {
      setMessage({ text: `Error updating password: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: updatedInfo.displayName
      });
      
      // Update in auth
      if (updatedInfo.email !== user.email) {
        // Note: Email update requires additional verification steps
        setMessage({ text: 'Email update requires verification. Check your email.', type: 'info' });
      }
      
      setUserData({
        ...userData,
        displayName: updatedInfo.displayName
      });
      
      setEditMode(false);
      setMessage({ text: 'Profile updated successfully', type: 'success' });
    } catch (error) {
      setMessage({ text: `Error updating profile: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle role change
  const handleRoleChange = async (userId, newRole) => {
    setLoading(true);
    try {
      const batch = writeBatch(db);
      
      // Update user role in users collection
      const userRef = doc(db, 'users', userId);
      batch.update(userRef, { role: newRole });
      
      // If new role is admin, add to admins collection
      if (newRole === 'admin') {
        const adminRef = doc(db, 'admins', userId);
        batch.set(adminRef, { role: 'admin', createdAt: new Date() });
      } else if (newRole === 'member') {
        // If demoting from admin, remove from admins collection
        const adminRef = doc(db, 'admins', userId);
        batch.delete(adminRef);
      }
      
      await batch.commit();
      
      // Update local state
      setUsers(users.map(u => 
        u.id === userId ? { ...u, role: newRole } : u
      ));
      
      setMessage({ text: 'User role updated successfully', type: 'success' });
    } catch (error) {
      setMessage({ text: `Error updating user role: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Handle account deletion
  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      // Re-authenticate user before deletion
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user data from Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        deleted: true,
        deletedAt: new Date()
      });
      
      // Delete user from authentication
      await deleteUser(user);
      
      // Note: You might want to sign out the user and redirect to login page
      setMessage({ text: 'Account deleted successfully', type: 'success' });
    } catch (error) {
      setMessage({ text: `Error deleting account: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <h1>Admin Settings</h1>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="settings-card">
        <h2>Account Information</h2>
        
        <div className="info-section">
          <div className="info-item">
            <span className="info-label">Name:</span>
            {editMode ? (
              <input
                type="text"
                value={updatedInfo.displayName}
                onChange={(e) => setUpdatedInfo({...updatedInfo, displayName: e.target.value})}
              />
            ) : (
              <span className="info-value">{userData.displayName}</span>
            )}
          </div>
          
          <div className="info-item">
            <span className="info-label">Email:</span>
            {editMode ? (
              <input
                type="email"
                value={updatedInfo.email}
                onChange={(e) => setUpdatedInfo({...updatedInfo, email: e.target.value})}
              />
            ) : (
              <span className="info-value">{userData.email}</span>
            )}
          </div>
          
          <div className="info-item">
            <span className="info-label">Role:</span>
            <span className="info-value">{userData.role}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Subscription Status:</span>
            <span className={`info-value ${userData.subscriptionStatus === 'active' ? 'active' : 'inactive'}`}>
              {userData.subscriptionStatus}
            </span>
          </div>
          
          {userData.subscriptionEnd && (
            <div className="info-item">
              <span className="info-label">Subscription Ends:</span>
              <span className="info-value">{userData.subscriptionEnd}</span>
            </div>
          )}
        </div>
        
        <div className="button-group">
          {editMode ? (
            <>
              <button 
                className="save-button" 
                onClick={handleProfileUpdate}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                className="cancel-button" 
                onClick={() => {
                  setEditMode(false);
                  setUpdatedInfo({
                    displayName: userData.displayName,
                    email: userData.email
                  });
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <button 
              className="edit-button" 
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
      
      <div className="settings-card">
        <h2>Treasury Information</h2>
        <div className="treasury-info">
          <div className="treasury-balance">
            <span className="info-label">Current Balance:</span>
            <span className="info-value">${treasuryBalance.toFixed(2)}</span>
          </div>
          <div className="treasury-actions">
            <button className="treasury-button">Add Funds</button>
            <button className="treasury-button">Withdraw Funds</button>
            <button className="treasury-button">View Transactions</button>
          </div>
        </div>
      </div>
      
      <div className="settings-card">
        <h2>User Management</h2>
        <div className="user-management">
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.displayName || 'N/A'}</td>
                  <td>{user.email}</td>
                  <td>{user.role}</td>
                  <td>
                    <select 
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={loading || user.id === auth.currentUser?.uid}
                    >
                      <option value="viewer">Viewer</option>
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      
      <div className="settings-card">
        <h2>Change Password</h2>
        <form onSubmit={handlePasswordUpdate}>
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password:</label>
            <input
              type="password"
              id="currentPassword"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="newPassword">New Password:</label>
            <input
              type="password"
              id="newPassword"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password:</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          
          <button 
            type="submit" 
            className="update-button"
            disabled={loading}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
      
      <div className="settings-card danger-zone">
        <h2>Danger Zone</h2>
        <div className="danger-item">
          <div>
            <h3>Delete Account</h3>
            <p>Permanently delete your account and all associated data.</p>
          </div>
          <button 
            className="delete-button"
            onClick={handleDeleteAccount}
            disabled={loading || !currentPassword}
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
