import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  doc, 
  getDoc 
} from "firebase/firestore";

/**
 * PremiumUserData class - A data access layer for user information
 * Makes user data easily accessible without repeated Firestore calls
 */
class PremiumUserData {
  constructor(userId, userEmail) {
    this.userId = userId;
    this.userEmail = userEmail;
    this.db = getFirestore();
    
    // User data cache
    this.userData = null;
    this.isVerified = false;
    this.error = null;
    
    // Specific user fields
    this.email = null;
    this.program = null;
    this.yearOfStudy = null;
    this.profilePic = null;
    this.role = null;
    this.subscriptionStart = null;
    this.subscriptionEnd = null;
    this.createdAt = null;
  }

  /**
   * Verify user has proper authentication and exists in Firestore
   * @returns {Promise<boolean>} Whether verification was successful
   */
  async verifyUser() {
    if (!this.userId || !this.userEmail) {
      this.error = "User authentication information missing";
      return false;
    }
    
    try {
      const userDocRef = doc(this.db, "users", this.userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (!userDocSnap.exists()) {
        this.error = "User account not found";
        return false;
      }
      
      this.userData = userDocSnap.data();
      
      // Verify email matches the stored user document
      if (this.userData.email !== this.userEmail) {
        this.error = "User authentication mismatch";
        return false;
      }
      
      // Load user data into class properties
      this.loadUserData();
      
      this.isVerified = true;
      return true;
    } catch (err) {
      console.error("Authentication error:", err);
      this.error = "Failed to verify user. Please log in again.";
      return false;
    }
  }

  /**
   * Load user data from userData object into class properties
   */
  loadUserData() {
    if (!this.userData) return;
    
    this.email = this.userData.email || null;
    this.program = this.userData.program || null;
    this.yearOfStudy = this.userData.yearOfStudy || null;
    this.profilePic = this.userData.profilePic || null;
    this.role = this.userData.role || null;
    this.subscriptionStart = this.userData.subscriptionStart || null;
    this.subscriptionEnd = this.userData.subscriptionEnd || null;
    this.createdAt = this.userData.createdAt || null;
  }

  /**
   * Fetch user data from Firestore
   * @returns {Promise<Object|null>} User data object or null if not found
   */
async fetchUserData() {
  if (!this.isVerified) {
    const verified = await this.verifyUser();
    if (!verified) return null;
  }
  
  return this.userData;
}
  /**
   * Check if user is a premium member (has valid subscription)
   * @returns {boolean} Whether user is a premium member
   */


  isPremiumMember() {
    if (!this.userData || !this.role) return false;
    
    // Only check if the user has a "member" or "admin" role
    return this.role === "member" || this.role === "admin";
  }

  
  /**
   * Check if user is an admin
   * @returns {boolean} Whether user is an admin
   */
  isAdmin() {
    return this.role === "admin";
  }

  /**
   * Get days left in subscription
   * @returns {number} Days left or 0 if expired
   */
  getDaysLeftInSubscription() {
    if (!this.subscriptionEnd) return 0;
    
    const now = new Date();
    const endDate = new Date(this.subscriptionEnd);
    
    if (now > endDate) return 0;
    
    const diffTime = Math.abs(endDate - now);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  }

  /**
   * Get formatted subscription dates
   * @returns {Object} Object with formatted dates
   */
  getSubscriptionDates() {
    return {
      start: this.subscriptionStart ? new Date(this.subscriptionStart).toLocaleDateString() : null,
      end: this.subscriptionEnd ? new Date(this.subscriptionEnd).toLocaleDateString() : null
    };
  }

  /**
   * Get user program
   * @returns {string|null} User's program
   */
  getProgram() {
    return this.program;
  }

  /**
   * Get user year of study
   * @returns {string|null} User's year of study
   */
  getYearOfStudy() {
    return this.yearOfStudy;
  }

  /**
   * Get user profile picture URL
   * @returns {string|null} Profile picture URL
   */
  getProfilePic() {
    return this.profilePic;
  }

  /**
   * Get user email
   * @returns {string|null} User's email
   */
  getEmail() {
    return this.email;
  }

  /**
   * Get user role
   * @returns {string|null} User's role (viewer, member, admin)
   */
  getRole() {
    return this.role;
  }

  /**
   * Get the current error message if any
   * @returns {string|null} Error message or null
   */
  getError() {
    return this.error;
  }
  
  /**
   * Clear the current error message
   */
  clearError() {
    this.error = null;
  }
  
  /**
   * Get complete user data object
   * @returns {Object|null} User data object
   */
  getUserData() {
    return this.userData;
  }
}

export default PremiumUserData;