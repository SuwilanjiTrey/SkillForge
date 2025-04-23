import { 
  getFirestore, 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  getDoc 
} from "firebase/firestore";

/**
 * CourseData class - A data access layer for course information
 * Makes course data easily accessible without repeated Firestore calls
 */
class CourseData {
  constructor(userId, userEmail) {
    this.userId = userId;
    this.userEmail = userEmail;
    this.db = getFirestore();
    
    // Course data cache
    this.courses = [];
    this.userProgram = null;
    this.yearOfStudy = null;
    this.userData = null;
    this.isVerified = false;
    this.error = null;
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
      
      // Store user info for course filtering
      this.userProgram = this.userData.program || null;
      this.yearOfStudy = this.userData.yearOfStudy || null;
      
      this.isVerified = true;
      return true;
    } catch (err) {
      console.error("Authentication error:", err);
      this.error = "Failed to verify membership. Please log in again.";
      return false;
    }
  }

  /**
   * Get visible years based on student's year of study
   * @returns {Array<string>} Array of visible year levels
   */
  getVisibleYears() {
    if (!this.yearOfStudy) return ["1st Year"];
    
    const yearMapping = {
      "1st Year": ["1st Year"],
      "2nd Year": ["1st Year", "2nd Year"],
      "3rd Year": ["1st Year", "2nd Year", "3rd Year"],
      "4th Year": ["1st Year", "2nd Year", "3rd Year", "4th Year"],
      "5th Year": ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"]
    };
    
    return yearMapping[this.yearOfStudy] || ["1st Year"];
  }

  /**
   * Fetch courses matching user's program and visible years
   * @returns {Promise<Array>} Array of course objects
   */
  async fetchCourses() {
    if (!this.isVerified) {
      const verified = await this.verifyUser();
      if (!verified) return [];
    }
    
    try {
      const visibleYears = this.getVisibleYears();
      const coursesRef = collection(this.db, "courses");
      let coursesSnapshot;
      
      // Handle case when program is missing
      if (!this.userProgram) {
        // Just get all courses without program filter
        const coursesQuery = query(
          coursesRef,
          orderBy("createdAt", "desc")
        );
        coursesSnapshot = await getDocs(coursesQuery);
      } else {
        // Create query based on user's program
        const coursesQuery = query(
          coursesRef,
          where("targetPrograms", "==", this.userProgram),
          orderBy("createdAt", "desc")
        );
        coursesSnapshot = await getDocs(coursesQuery);
      }
      
      // Filter courses by visible years if yearOfStudy is available
      this.courses = coursesSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(course => {
          // If course has no targetYear, show it to all users
          if (!course.targetYear) return true;
          
          // If user has no yearOfStudy, show all courses
          if (!this.yearOfStudy) return true;
          
          // Filter by visible years
          return visibleYears.includes(course.targetYear);
        });
      
      return this.courses;
    } catch (err) {
      console.error("Error fetching course data:", err);
      this.error = "Failed to load course data. Please try again later.";
      return [];
    }
  }

  /**
   * Get recent courses limited to specified number
   * @param {number} limit Number of courses to return
   * @returns {Array} Limited array of course objects
   */
  getRecentCourses(limitCount = 3) {
    return this.courses.slice(0, limitCount);
  }

  /**
   * Get a specific course by ID
   * @param {string} courseId 
   * @returns {Promise<Object|null>} Course object or null if not found
   */
  async getCourseById(courseId) {
    try {
      const courseDocRef = doc(this.db, "courses", courseId);
      const courseDocSnap = await getDoc(courseDocRef);
      
      if (courseDocSnap.exists()) {
        return {
          id: courseDocSnap.id,
          ...courseDocSnap.data()
        };
      }
      return null;
    } catch (err) {
      console.error("Error fetching course by ID:", err);
      this.error = "Failed to load course details.";
      return null;
    }
  }

  /**
   * Get cached courses (use fetchCourses first if not yet loaded)
   * @returns {Array} Array of course objects
   */
  getCachedCourses() {
    return this.courses;
  }
  
  /**
   * Filter cached courses by year
   * @param {string} year - Target year to filter by
   * @returns {Array} Filtered course objects
   */
  getCoursesByYear(year) {
    return this.courses.filter(course => course.targetYear === year);
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
}

export default CourseData;