import React, { useState, useEffect } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc } from "firebase/firestore";
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  Calendar,
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle
} from "lucide-react";
import './styles/tutorsettings.css';

const TutorSettings = () => {
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
    role: '',
    createdAt: null,
    assignedCourses: []
  });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [editMode, setEditMode] = useState(false);
  const [updatedInfo, setUpdatedInfo] = useState({
    displayName: '',
    phoneNumber: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [processing, setProcessing] = useState(false);

  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Get user document
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            displayName: data.displayName || '',
            email: user.email,
            phoneNumber: data.phoneNumber || '',
            role: data.role || 'tutor',
            createdAt: data.createdAt ? new Date(data.createdAt.seconds * 1000) : null,
            assignedCourses: []
          });
          setUpdatedInfo({
            displayName: data.displayName || '',
            phoneNumber: data.phoneNumber || ''
          });
        }

        // Get tutor document for additional info
        const tutorDoc = await getDoc(doc(db, 'tutors', user.uid));
        if (tutorDoc.exists()) {
          const tutorData = tutorDoc.data();
          setUserData(prev => ({
            ...prev,
            assignedCourses: tutorData.assignedCourses || []
          }));
        }
      } catch (error) {
        setMessage({ text: `Error fetching user data: ${error.message}`, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, db]);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setProcessing(true);
    
    try {
      // Update in Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: updatedInfo.displayName,
        phoneNumber: updatedInfo.phoneNumber
      });
      
      // Update in auth
      if (user.displayName !== updatedInfo.displayName) {
        await user.updateProfile({
          displayName: updatedInfo.displayName
        });
      }
      
      setUserData({
        ...userData,
        displayName: updatedInfo.displayName,
        phoneNumber: updatedInfo.phoneNumber
      });
      
      setEditMode(false);
      setMessage({ text: 'Profile updated successfully', type: 'success' });
    } catch (error) {
      setMessage({ text: `Error updating profile: ${error.message}`, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' });
      return;
    }
    
    if (passwordForm.newPassword.length < 6) {
      setMessage({ text: 'Password should be at least 6 characters', type: 'error' });
      return;
    }
    
    setProcessing(true);
    try {
      // Re-authenticate user before password change
      const credential = EmailAuthProvider.credential(user.email, passwordForm.currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, passwordForm.newPassword);
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      setMessage({ text: 'Password updated successfully', type: 'success' });
    } catch (error) {
      setMessage({ text: `Error updating password: ${error.message}`, type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setMessage({ text: 'Please enter your password to delete your account', type: 'error' });
      return;
    }
    
    setProcessing(true);
    try {
      // Re-authenticate user before deletion
      const credential = EmailAuthProvider.credential(user.email, deletePassword);
      await reauthenticateWithCredential(user, credential);
      
      // Delete user data from Firestore
      await updateDoc(doc(db, 'users', user.uid), {
        deleted: true,
        deletedAt: new Date()
      });
      
      // Delete tutor document
      const tutorDoc = await getDoc(doc(db, 'tutors', user.uid));
      if (tutorDoc.exists()) {
        await updateDoc(doc(db, 'tutors', user.uid), {
          deleted: true,
          deletedAt: new Date()
        });
      }
      
      // Delete user from authentication
      await deleteUser(user);
      
      setMessage({ text: 'Account deleted successfully', type: 'success' });
      // Redirect will happen automatically after account deletion
    } catch (error) {
      setMessage({ text: `Error deleting account: ${error.message}`, type: 'error' });
      setProcessing(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString();
  };

  if (loading) {
    return <div className="loading-spinner">Loading settings...</div>;
  }

  return (
    <div className="settings-container">
      <h1>Tutor Settings</h1>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
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
            <span className="info-value">{userData.email}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Phone:</span>
            {editMode ? (
              <input
                type="tel"
                value={updatedInfo.phoneNumber}
                onChange={(e) => setUpdatedInfo({...updatedInfo, phoneNumber: e.target.value})}
              />
            ) : (
              <span className="info-value">{userData.phoneNumber || 'Not provided'}</span>
            )}
          </div>
          
          <div className="info-item">
            <span className="info-label">Role:</span>
            <span className="info-value">{userData.role}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Member Since:</span>
            <span className="info-value">{formatDate(userData.createdAt)}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Assigned Courses:</span>
            <span className="info-value">{userData.assignedCourses.length} courses</span>
          </div>
        </div>
        
        <div className="button-group">
          {editMode ? (
            <>
              <button 
                className="save-button" 
                onClick={handleProfileUpdate}
                disabled={processing}
              >
                {processing ? 'Saving...' : 'Save Changes'}
              </button>
              <button 
                className="cancel-button" 
                onClick={() => {
                  setEditMode(false);
                  setUpdatedInfo({
                    displayName: userData.displayName,
                    phoneNumber: userData.phoneNumber
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
              <Edit size={16} /> Edit Profile
            </button>
          )}
        </div>
      </div>
      
      <div className="settings-card">
        <h2>Security</h2>
        
        {!showPasswordForm ? (
          <div className="security-section">
            <div className="security-item">
              <div className="security-icon">
                <Lock size={24} />
              </div>
              <div className="security-info">
                <h3>Password</h3>
                <p>Last changed recently</p>
              </div>
              <button 
                className="change-password-btn"
                onClick={() => setShowPasswordForm(true)}
              >
                Change Password
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handlePasswordUpdate} className="password-form">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({...passwordForm, currentPassword: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                required
              />
            </div>
            
            <div className="form-actions">
              <button 
                type="submit" 
                className="save-button"
                disabled={processing}
              >
                {processing ? 'Updating...' : 'Update Password'}
              </button>
              <button 
                type="button" 
                className="cancel-button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                  });
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
      
      <div className="settings-card danger-zone">
        <h2>Danger Zone</h2>
        <div className="danger-item">
          <div>
            <h3>Delete Account</h3>
            <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
            
            {showDeleteConfirm && (
              <div className="delete-confirm">
                <div className="form-group">
                  <label htmlFor="deletePassword">Enter your password to confirm</label>
                  <input
                    type="password"
                    id="deletePassword"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </div>
                <div className="confirm-actions">
                  <button 
                    className="cancel-button"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeletePassword('');
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    className="delete-button"
                    onClick={handleDeleteAccount}
                    disabled={processing || !deletePassword}
                  >
                    {processing ? 'Deleting...' : 'Delete Account'}
                  </button>
                </div>
              </div>
            )}
          </div>
          {!showDeleteConfirm && (
            <button 
              className="delete-button"
              onClick={() => setShowDeleteConfirm(true)}
            >
              Delete Account
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TutorSettings;
