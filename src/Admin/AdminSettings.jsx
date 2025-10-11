// src/components/admin/AdminSettings.jsx
import React, { useState, useEffect } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  Lock, 
  User, 
  Save, 
  X,
  AlertTriangle,
  Check
} from 'lucide-react';
import './styles/admin.css';

const AdminSettings = () => {
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    role: '',
    subscriptionStatus: '',
    subscriptionEnd: null
  });
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
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
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

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: updatedInfo.displayName
      });
      
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

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }
    
    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      await updateDoc(doc(db, 'users', user.uid), {
        deleted: true,
        deletedAt: new Date()
      });
      
      await deleteUser(user);
      
      setMessage({ text: 'Account deleted successfully', type: 'success' });
    } catch (error) {
      setMessage({ text: `Error deleting account: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>Account Settings</h2>
        <p>Manage your account information and security settings</p>
      </div>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <Check size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}
      
      <div className="settings-card">
        <div className="card-header">
          <h3><User size={18} /> Profile Information</h3>
          {!editMode && (
            <button 
              className="edit-button" 
              onClick={() => setEditMode(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
        
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
            <span className="info-value">{userData.email}</span>
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
        
        {editMode && (
          <div className="button-group">
            <button 
              className="save-button" 
              onClick={handleProfileUpdate}
              disabled={loading}
            >
              {loading ? 'Saving...' : <><Save size={16} /> Save Changes</>}
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
          </div>
        )}
      </div>
      
      <div className="settings-card">
        <div className="card-header">
          <h3><Lock size={18} /> Security</h3>
        </div>
        
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
            {loading ? 'Updating...' : <><Lock size={16} /> Update Password</>}
          </button>
        </form>
      </div>
      
      <div className="settings-card danger-zone">
        <div className="card-header">
          <h3><AlertTriangle size={18} /> Danger Zone</h3>
        </div>
        <div className="danger-item">
          <div>
            <h4>Delete Account</h4>
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
