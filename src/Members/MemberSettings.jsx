// src/components/MemberSettings.jsx
import React, { useState, useEffect, useRef } from 'react';
import { getAuth, updatePassword, reauthenticateWithCredential, EmailAuthProvider, deleteUser } from "firebase/auth";
import { getFirestore, doc, getDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";
import { 
  User, 
  Camera, 
  Lock, 
  Mail, 
  Shield, 
  Bell, 
  Monitor, 
  Moon, 
  Sun,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff
} from "lucide-react";
import '../Styles/settings.css';

const MemberSettings = () => {
  const [userData, setUserData] = useState({
    displayName: '',
    email: '',
    role: '',
    subscriptionStatus: '',
    subscriptionEnd: null,
    profilePicture: ''
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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);

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
            subscriptionEnd: data.subscriptionEnd ? data.subscriptionEnd.toDate().toLocaleDateString() : null,
            profilePic: data.profilePic || ''
          });
          setUpdatedInfo({
            displayName: data.displayName || '',
            email: user.email
          });
          
          // Set profile picture preview if available
          if (data.profilePic) {
            setProfilePicturePreview(data.profilePic);
          }
        }
      } catch (error) {
        setMessage({ text: `Error fetching user data: ${error.message}`, type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, db]);

  // Handle profile picture upload
  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file type
      if (!file.type.match('image.*')) {
        setMessage({ text: 'Please select an image file', type: 'error' });
        return;
      }
      
      // Check file size (limit to 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ text: 'Image size should be less than 5MB', type: 'error' });
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfilePicturePreview(base64String);
        // Update the profile picture in the updatedInfo
        setUpdatedInfo(prev => ({ ...prev, profilePicture: base64String }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

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
    setIsUploading(true);
    try {
      // Prepare update data
      const updateData = {
        displayName: updatedInfo.displayName
      };
      
      // Include profile picture if it was changed
      if (updatedInfo.profilePicture && updatedInfo.profilePicture !== userData.profilePicture) {
        updateData.profilePicture = updatedInfo.profilePicture;
      }
      
      // Update in Firestore
      await updateDoc(doc(db, 'users', user.uid), updateData);
      
      // Update in auth (display name only)
      if (updatedInfo.displayName !== userData.displayName) {
        // Note: Email update requires additional verification steps
        setMessage({ text: 'Profile updated successfully', type: 'success' });
      }
      
      setUserData({
        ...userData,
        displayName: updatedInfo.displayName,
        profilePicture: updatedInfo.profilePicture
      });
      
      setEditMode(false);
      setMessage({ text: 'Profile updated successfully', type: 'success' });
    } catch (error) {
      setMessage({ text: `Error updating profile: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
      setIsUploading(false);
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

  // Clear message after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>
      
      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <AlertTriangle size={20} />
          )}
          {message.text}
        </div>
      )}
      
      <div className="settings-grid">
        {/* Profile Card */}
        <div className="settings-card profile-card">
          <div className="card-header">
            <h2>Profile Information</h2>
            {editMode ? (
              <div className="edit-actions">
                <button 
                  className="cancel-btn" 
                  onClick={() => {
                    setEditMode(false);
                    setUpdatedInfo({
                      displayName: userData.displayName,
                      email: userData.email,
                      profilePicture: userData.profilePicture
                    });
                    setProfilePicturePreview(userData.profilePicture);
                  }}
                >
                  <X size={18} />
                </button>
                <button 
                  className="save-btn" 
                  onClick={handleProfileUpdate}
                  disabled={loading || isUploading}
                >
                  {loading || isUploading ? 'Saving...' : <><Save size={18} /> Save</>}
                </button>
              </div>
            ) : (
              <button 
                className="edit-btn" 
                onClick={() => setEditMode(true)}
              >
                Edit Profile
              </button>
            )}
          </div>
          
          <div className="profile-section">
            <div className="profile-picture-container">
              <div className="profile-picture">
                {profilePicturePreview ? (
                  <img src={profilePicturePreview} alt="Profile" />
                ) : (
                  <div className="profile-picture-placeholder">
                    <User size={48} />
                  </div>
                )}
              </div>
              
              {editMode && (
                <div className="profile-picture-upload">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleProfilePictureChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button 
                    className="upload-btn"
                    onClick={triggerFileInput}
                  >
                    <Camera size={18} />
                    Change Photo
                  </button>
                </div>
              )}
            </div>
            
            <div className="profile-info">
              <div className="info-item">
                <span className="info-label">Name</span>
                {editMode ? (
                  <input
                    type="text"
                    className="info-input"
                    value={updatedInfo.displayName}
                    onChange={(e) => setUpdatedInfo({...updatedInfo, displayName: e.target.value})}
                    placeholder="Your name"
                  />
                ) : (
                  <span className="info-value">{userData.displayName || 'Not set'}</span>
                )}
              </div>
              
              <div className="info-item">
                <span className="info-label">Email</span>
                {editMode ? (
                  <input
                    type="email"
                    className="info-input"
                    value={updatedInfo.email}
                    onChange={(e) => setUpdatedInfo({...updatedInfo, email: e.target.value})}
                    placeholder="Your email"
                  />
                ) : (
                  <span className="info-value">{userData.email}</span>
                )}
              </div>
              
              <div className="info-item">
                <span className="info-label">Role</span>
                <span className="info-value role-badge">{userData.role || 'member'}</span>
              </div>
              
              <div className="info-item">
                <span className="info-label">Subscription</span>
                <span className={`info-value subscription-badge ${userData.subscriptionStatus === 'active' ? 'active' : 'inactive'}`}>
                  {userData.subscriptionStatus || 'inactive'}
                </span>
              </div>
              
              {userData.subscriptionEnd && (
                <div className="info-item">
                  <span className="info-label">Subscription Ends</span>
                  <span className="info-value">{userData.subscriptionEnd}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Security Card */}
        <div className="settings-card security-card">
          <div className="card-header">
            <h2>Security</h2>
            <Shield size={20} />
          </div>
          
          <form onSubmit={handlePasswordUpdate}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <div className="password-input">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  id="currentPassword"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  required
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <div className="password-input">
                <input
                  type={showNewPassword ? "text" : "password"}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  required
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="password-hint">
                Must be at least 6 characters
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <div className="password-input">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                />
                <button 
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <button 
              type="submit" 
              className="update-password-btn"
              disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            >
              {loading ? 'Updating...' : <><Lock size={18} /> Update Password</>}
            </button>
          </form>
        </div>
        
        {/* Preferences Card */}
        <div className="settings-card preferences-card">
          <div className="card-header">
            <h2>Preferences</h2>
            <Monitor size={20} />
          </div>
          
          <div className="preference-item">
            <div className="preference-info">
              <h3>Theme</h3>
              <p>Customize the appearance of your learning environment</p>
            </div>
            <div className="theme-toggle">
              <button className="theme-option light">
                <Sun size={18} />
                Light
              </button>
              <button className="theme-option dark">
                <Moon size={18} />
                Dark
              </button>
            </div>
          </div>
          
          <div className="preference-item">
            <div className="preference-info">
              <h3>Notifications</h3>
              <p>Manage how you receive updates about your courses</p>
            </div>
            <div className="notification-toggle">
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider"></span>
              </label>
            </div>
          </div>
        </div>
        
        {/* Danger Zone Card */}
        <div className="settings-card danger-card">
          <div className="card-header">
            <h2>Danger Zone</h2>
            <AlertTriangle size={20} />
          </div>
          
          <div className="danger-item">
            <div className="danger-info">
              <h3>Delete Account</h3>
              <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
            </div>
            <button 
              className="delete-account-btn"
              onClick={handleDeleteAccount}
              disabled={loading || !currentPassword}
            >
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MemberSettings;
