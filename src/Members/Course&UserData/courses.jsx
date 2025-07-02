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
    //console.log("Attempting to verify user");
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
      
      /*console.log(`User info:
        Email: ${this.userEmail},
        Program: ${this.userProgram},
        Year: ${this.yearOfStudy}
      `);*/
      
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
   * Students can see courses for their current year and future years (but not past years they've completed)
   * @returns {Array<string>} Array of visible year levels
   */
  getVisibleYears() {
    if (!this.yearOfStudy) return ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
    
    const yearMapping = {
      "1st Year": ["1st Year"],
      "2nd Year": ["1st Year","2nd Year"],
      "3rd Year": ["1st Year","2nd Year","3rd Year"],
      "4th Year": ["1st Year","2nd Year","3rd Year","4th Year"],
      "5th Year": ["1st Year","2nd Year","3rd Year","4th Year","5th Year"]
    };
    
    return yearMapping[this.yearOfStudy] || ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year"];
  }

  /**
   * Fetch courses matching user's program and visible years
   * @returns {Promise<Array>} Array of course objects
   */
  async fetchCourses() {
    if (!this.isVerified) {
      const verified = await this.verifyUser();
      //console.log("Verification status:", verified);
      if (verified === false) { 
        return []; 
      } else { 
        //console.log("User verified successfully.. proceed"); 
      }
    }
    
    try {
      const visibleYears = this.getVisibleYears();
      //console.log("Visible years for user:", visibleYears);
      
      const coursesRef = collection(this.db, "courses");
      let coursesSnapshot;
      
      // Handle case when program is missing
      if (!this.userProgram) {
        //console.log("No user program found, fetching all courses");
        const coursesQuery = query(
          coursesRef,
          orderBy("createdAt", "desc")
        );
        coursesSnapshot = await getDocs(coursesQuery);
      } else {
        // Create query based on user's program
        //console.log("User program:", this.userProgram);
        
        // Try different query approaches based on how targetPrograms is stored
        let coursesQuery;
        
        // First, try array-contains if targetPrograms is an array
        try {
	//console.log("attempting to fetch courses based on program")
          coursesQuery = query(
            coursesRef,
            where("targetPrograms", "array-contains", this.userProgram)
            
          );
          coursesSnapshot = await getDocs(coursesQuery);
          //console.log("Used array-contains query, found", coursesSnapshot.docs.length, "courses");
        } catch (arrayError) {
          //console.log("Array-contains failed, trying equality match");
          // If that fails, try direct equality
          coursesQuery = query(
            coursesRef,
            where("targetPrograms", "==", this.userProgram)
          );
          coursesSnapshot = await getDocs(coursesQuery);
          //console.log("Used equality query, found", coursesSnapshot.docs.length, "courses");
        }
      }
      
      //console.log("Total courses retrieved from Firebase:", coursesSnapshot.docs.length);
      
      // Map courses first
      const allCourses = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      /*console.log("All courses before filtering:", allCourses.map(c => ({
        id: c.id,
        targetYears: c.targetYears,
        targetPrograms: c.targetPrograms,
        title: c.title || c.name
      })));*/
      
      // MODIFIED: More lenient year filtering logic
      this.courses = allCourses.filter(course => {
        //console.log(`Filtering course: ${course.title || course.name}`);
        //console.log(`Course targetYears:`, course.targetYears);
        //console.log(`User visible years:`, visibleYears);
        
        // If course has no targetYears, show it to all users
        if (!course.targetYears || 
            (!Array.isArray(course.targetYears) && !course.targetYears) ||
            (Array.isArray(course.targetYears) && course.targetYears.length === 0)) {
          //console.log("Course has no targetYears or is empty, including it");
          return true;
        }
        
        // If user has no yearOfStudy, show all courses
        if (!this.yearOfStudy) {
          //console.log("User has no yearOfStudy, including course");
          return true;
        }
        
        // Handle both array and string formats for targetYears
        let courseYears = [];
        if (Array.isArray(course.targetYears)) {
          courseYears = course.targetYears;
        } else if (typeof course.targetYears === 'string') {
          courseYears = [course.targetYears];
        } else {
          // If targetYears exists but isn't array or string, include the course
          //console.log("Course targetYears in unexpected format, including it");
          return true;
        }
        
        // Check if any of the course's target years match any of the user's visible years
        const hasMatchingYear = courseYears.some(courseYear => {
          const normalizedCourseYear = courseYear.toString().trim();
          const match = visibleYears.some(userYear => {
            const normalizedUserYear = userYear.toString().trim();
            return normalizedUserYear === normalizedCourseYear;
          });
          //console.log(`Comparing course year "${normalizedCourseYear}" with user years:`, visibleYears, "Match:", match);
          return match;
        });
        
        //console.log(`Course has matching year:`, hasMatchingYear);
        return hasMatchingYear;
      });
      
      /*console.log("Final filtered courses:", this.courses.length);
      console.log("Filtered courses details:", this.courses.map(c => ({
        id: c.id,
        title: c.title || c.name,
        targetYears: c.targetYears,
        targetPrograms: c.targetPrograms
      })));*/
      
      return this.courses;
    } catch (err) {
      //console.error("Error fetching course data:", err);
      this.error = "Failed to load course data. Please try again later.";
      return [];
    }
  }

  /**
   * Alternative method to fetch courses without program filtering (for debugging)
   * @returns {Promise<Array>} Array of all course objects
   */
  async fetchAllCourses() {
    try {
      const coursesRef = collection(this.db, "courses");
      const coursesQuery = query(coursesRef, orderBy("createdAt", "desc"));
      const coursesSnapshot = await getDocs(coursesQuery);
      
      const allCourses = coursesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log("All courses in database:", allCourses);
      return allCourses;
    } catch (err) {
      console.error("Error fetching all courses:", err);
      return [];
    }
  }

  /**
   * Get recent courses limited to specified number
   * @param {number} limitCount Number of courses to return
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
    return this.courses.filter(course => 
      course.targetYears && 
      Array.isArray(course.targetYears) && 
      course.targetYears.includes(year)
    );
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
   * Debug method to check data structure
   * FIXED: Now returns debug information instead of undefined
   * @returns {Object} Debug information object
   */
  debugCourseStructure() {
    const debugInfo = {
      userProgram: this.userProgram,
      userYearOfStudy: this.yearOfStudy,
      visibleYears: this.getVisibleYears(),
      totalCourses: this.courses.length,
      courses: this.courses.map((course, index) => ({
        index: index + 1,
        id: course.id,
        title: course.title || course.name,
        targetPrograms: course.targetPrograms,
        targetYears: course.targetYears
      }))
    };
    
    console.log("=== DEBUG COURSE STRUCTURE ===");
    console.log("User Program:", debugInfo.userProgram);
    console.log("User Year of Study:", debugInfo.userYearOfStudy);
    console.log("Visible Years:", debugInfo.visibleYears);
    console.log("Total Courses:", debugInfo.totalCourses);
    
    debugInfo.courses.forEach((course) => {
      console.log(`Course ${course.index}:`, {
        id: course.id,
        title: course.title,
        targetPrograms: course.targetPrograms,
        targetYears: course.targetYears
      });
    });
    
    // Return the debug info instead of undefined
    return debugInfo;
  }
}

export default CourseData;