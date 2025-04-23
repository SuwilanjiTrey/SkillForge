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
 * AssessmentData class - A data access layer for assessment information
 * Makes assessment data easily accessible without repeated Firestore calls
 */
class AssessmentData {
  constructor(userId, userEmail) {
    this.userId = userId;
    this.userEmail = userEmail;
    this.db = getFirestore();
    
    // Assessment data cache
    this.assessments = [];
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
      
      // Store user info for assessment filtering
      this.userProgram = this.userData.program;
      this.yearOfStudy = this.userData.yearOfStudy;
      
      // Verify that required fields exist
      if (!this.userProgram) {
        console.warn("User program is undefined. Using fallback query.");
      }
      
      if (!this.yearOfStudy) {
        console.warn("Year of study is undefined. Using default year of study.");
        this.yearOfStudy = "1st Year"; // Default value
      }
      
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
    console.log("Original year of study:", this.yearOfStudy);
    
    // Normalize the yearOfStudy to handle case sensitivity
    const normalizedYear = this.yearOfStudy ? this.yearOfStudy.toLowerCase() : "1st year";
    
    const yearMapping = {
      "1st year": ["1st year"],
      "2nd year": ["1st year", "2nd year"],
      "3rd year": ["1st year", "2nd year", "3rd year"],
      "4th year": ["1st year", "2nd year", "3rd year", "4th year"],
      "5th year": ["1st year", "2nd year", "3rd year", "4th year", "5th year"]
    };
    
    // Try with lowercase first
    let visibleYears = yearMapping[normalizedYear];
    
    // If that didn't work, try with original case
    if (!visibleYears) {
      visibleYears = yearMapping[this.yearOfStudy];
    }
    
    // If still not found, use default
    if (!visibleYears) {
      console.log("Year of study not found in mapping, using default");
      visibleYears = ["1st year"];
    }
    
    console.log("Calculated visible years:", visibleYears);
    return visibleYears;
  }


  /**
   * Fetch all assessments matching user's program and visible years
   * @returns {Promise<Array>} Array of assessment objects
   */
  async fetchAssessments() {
    if (!this.isVerified) {
      const verified = await this.verifyUser();
      if (!verified) return [];
    }
    
    try {
      const assessmentsRef = collection(this.db, "Assessments");
      
      // Start with a simple query - no filters
      const assessmentsQuery = query(assessmentsRef);
      
      console.log("Executing simple query to check for any assessments");
      const assessmentsSnapshot = await getDocs(assessmentsQuery);
      
      console.log("Raw assessment count:", assessmentsSnapshot.size);
      console.log("Raw assessment data:", assessmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })));
      
      if (assessmentsSnapshot.empty) {
        console.log("No assessments found in the database at all");
        return [];
      }
      
      // Now add your filters back gradually
      const allAssessments = assessmentsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Check if program filter is working
      if (this.userProgram) {
        const programFiltered = allAssessments.filter(assessment => 
          assessment.program === this.userProgram
        );
        console.log("After program filter:", programFiltered);
        
        if (programFiltered.length === 0) {
          console.log("Program filter eliminated all results. User program:", this.userProgram);
          return [];
        }
      }
      
      // Check if year filter is working
      const visibleYears = this.getVisibleYears();
      console.log("Visible years:", visibleYears);
      
      const yearFiltered = allAssessments.filter(assessment => 
        visibleYears.includes(assessment.targetAudience)
      );
      console.log("After year filter:", yearFiltered);
      
      if (yearFiltered.length === 0) {
        console.log("Year filter eliminated all results. Check year formatting.");
        
        // Debug year format mismatches
        console.log("Assessment target audiences:", 
          [...new Set(allAssessments.map(a => a.targetAudience))]);
        
        return [];
      }
      
      this.assessments = yearFiltered;
      return this.assessments;
    } catch (err) {
      console.error("Error fetching assessment data:", err);
      console.error("Error details:", err.code, err.message);
      this.error = "Failed to load assessment data. Please try again later.";
      return [];
    }
  }

  /**
   * Get assessments for a specific course
   * @param {string} courseId - ID of the course
   * @returns {Promise<Array>} Array of assessment objects for the course
   */
  async getAssessmentsByCourse(courseId) {
    if (!this.isVerified) {
      const verified = await this.verifyUser();
      if (!verified) return [];
    }
    
    try {
      const visibleYears = this.getVisibleYears();
      const assessmentsRef = collection(this.db, "Assessments");
      
      let assessmentsQuery;
      
      // Create query based on course ID
      if (this.userProgram) {
        assessmentsQuery = query(
          assessmentsRef,
          where("courseId", "==", courseId),
          where("program", "==", this.userProgram)
        );
      } else {
        // Fallback: if program is undefined, query just by courseId
        assessmentsQuery = query(
          assessmentsRef,
          where("courseId", "==", courseId)
        );
      }
      
      const assessmentsSnapshot = await getDocs(assessmentsQuery);
      
      // Filter assessments by visible years
      const courseAssessments = assessmentsSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(assessment => visibleYears.includes(assessment.targetAudience));
      
      return courseAssessments;
    } catch (err) {
      console.error("Error fetching course assessments:", err);
      this.error = "Failed to load course assessments. Please try again later.";
      return [];
    }
  }

  /**
   * Get a specific assessment by ID
   * @param {string} assessmentId 
   * @returns {Promise<Object|null>} Assessment object or null if not found
   */
  async getAssessmentById(assessmentId) {
    try {
      const assessmentDocRef = doc(this.db, "Assessments", assessmentId);
      const assessmentDocSnap = await getDoc(assessmentDocRef);
      
      if (assessmentDocSnap.exists()) {
        return {
          id: assessmentDocSnap.id,
          ...assessmentDocSnap.data()
        };
      }
      return null;
    } catch (err) {
      console.error("Error fetching assessment by ID:", err);
      this.error = "Failed to load assessment details.";
      return null;
    }
  }

  /**
   * Get cached assessments (use fetchAssessments first if not yet loaded)
   * @returns {Array} Array of assessment objects
   */
  getCachedAssessments() {
    return this.assessments;
  }
  
  /**
   * Filter cached assessments by year
   * @param {string} year - Target audience year to filter by
   * @returns {Array} Filtered assessment objects
   */
  getAssessmentsByYear(year) {
    return this.assessments.filter(assessment => assessment.targetAudience === year);
  }
  
  /**
   * Filter cached assessments by course ID
   * @param {string} courseId - Course ID to filter by
   * @returns {Array} Filtered assessment objects
   */
  getCachedAssessmentsByCourse(courseId) {
    return this.assessments.filter(assessment => assessment.courseId === courseId);
  }
  
  /**
   * Filter cached assessments by assessment title
   * @param {string} searchTerm - Term to search in assessment titles
   * @returns {Array} Filtered assessment objects
   */
  searchAssessmentsByTitle(searchTerm) {
    if (!searchTerm) return this.assessments;
    
    const term = searchTerm.toLowerCase();
    return this.assessments.filter(assessment => 
      assessment.assessmentTitle.toLowerCase().includes(term)
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
}

export default AssessmentData;