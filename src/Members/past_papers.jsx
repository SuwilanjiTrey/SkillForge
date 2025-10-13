import React, { useEffect, useState } from "react";
import PremiumUserData from "./Course&UserData/userData.jsx";
import "../Styles/assessments.css";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, getDocs } from "firebase/firestore";

const AssessmentDisplay = () => {
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [courses, setCourses] = useState([]);
  const [userProgram, setUserProgram] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Calculate pagination
  const totalPages = Math.ceil(filteredAssessments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentAssessments = filteredAssessments.slice(startIndex, endIndex);

//update the fetchData useEffect to get the user's program
useEffect(() => {
  const fetchData = async () => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }
      
      const userId = user.uid;
      const userEmail = user.email;
      
      console.log("User data:", userId, userEmail);
      
      // First check if user is premium
      const userDataService = new PremiumUserData(userId, userEmail);
      
      if (userDataService.getError()) {
        setError(userDataService.getError());
        setLoading(false);
        return;
      }
      
      await userDataService.fetchUserData();

      setIsPremium(userDataService.isPremiumMember());
      
      // Get the user's program
      const userData = userDataService.userData;
      setUserProgram(userData.program || null);
      
      // Only fetch assessments if user is premium
      if (userDataService.isPremiumMember()) {
        // Fetch ALL assessments directly without filtering by program/year
        // Let the UI do the filtering
        const db = getFirestore();
        const assessmentsRef = collection(db, 'Assessments');
        const assessmentsSnapshot = await getDocs(assessmentsRef);
        
        const assessmentsList = assessmentsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        console.log("Total assessments fetched:", assessmentsList.length);
        console.log("Fetched assessments:", assessmentsList);
        
        setAssessments(assessmentsList);
        setFilteredAssessments(assessmentsList);
        
        // Extract unique course IDs (course codes) for filter dropdown
        // Group by courseId and show courseId - courseName format
        const uniqueCourseMap = new Map();
        assessmentsList.forEach(item => {
          if (item.courseId && !uniqueCourseMap.has(item.courseId)) {
            uniqueCourseMap.set(item.courseId, item.courseName || item.courseId);
          }
        });
        
        // Convert to array of objects for easier display
        const coursesArray = Array.from(uniqueCourseMap).map(([id, name]) => ({
          id,
          name
        }));
        
        setCourses(coursesArray);
        console.log("Unique courses:", coursesArray);
      } else {
        setError("Premium membership required to access assessments");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Failed to load assessments. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  
  fetchData();
}, []);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedYear, selectedCourse, searchTerm]);

  /**
   * ALGORITHM: Filter Assessments ONLY by CourseId (Course Code)
   * 
   * Primary filtering is done ONLY on courseId (course code like "CSC 2000")
   * This ensures consistency since courseName can vary (e.g., "Computer Programming" vs "Introduction to Programming")
   * 
   * Filters assessments based on:
   * 1. Year level (targetAudience) - case-insensitive
   * 2. Course code (courseId) - case-insensitive - PRIMARY FILTER
   * 3. Search term (assessmentTitle, courseName, or courseId) - case-insensitive
   */
// useEffect to include program filter
useEffect(() => {
  let filtered = [...assessments];

  console.log("Starting filter with:", {
    totalAssessments: assessments.length,
    selectedYear,
    selectedCourse,
    searchTerm,
    userProgram
  });

  // Filter by user's program (case-insensitive) - NEW FILTER
  if (userProgram) {
    filtered = filtered.filter(
      (assessment) => 
        assessment.program && 
        assessment.program.toLowerCase() === userProgram.toLowerCase()
    );
    console.log(`After program filter (${userProgram}):`, filtered.length);
  }

  // Filter by year (case-insensitive)
  if (selectedYear !== "all") {
    filtered = filtered.filter(
      (assessment) => 
        assessment.targetAudience && 
        assessment.targetAudience.toLowerCase() === selectedYear.toLowerCase()
    );
    console.log(`After year filter (${selectedYear}):`, filtered.length);
  }

  // Filter by course code (courseId) ONLY - case-insensitive
  if (selectedCourse !== "all") {
    filtered = filtered.filter(
      (assessment) => {
        const match = assessment.courseId && 
          assessment.courseId.toLowerCase() === selectedCourse.toLowerCase();
        
        if (match) {
          console.log(`Matched assessment: ${assessment.assessmentTitle} with courseId: ${assessment.courseId}`);
        }
        
        return match;
      }
    );
    console.log(`After course filter (${selectedCourse}):`, filtered.length);
  }

  // Filter by search term (case-insensitive)
  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (assessment) =>
        (assessment.assessmentTitle && assessment.assessmentTitle.toLowerCase().includes(term)) ||
        (assessment.courseName && assessment.courseName.toLowerCase().includes(term)) ||
        (assessment.courseId && assessment.courseId.toLowerCase().includes(term))
    );
    console.log(`After search filter ("${searchTerm}"):`, filtered.length);
  }

  console.log("Final filtered assessments:", filtered);
  setFilteredAssessments(filtered);
}, [selectedYear, selectedCourse, searchTerm, assessments, userProgram]); // Add userProgram to dependencies


  // Handle year filter change
  const handleYearFilter = (year) => {
    setSelectedYear(year);
  };

  // Handle course filter change
  const handleCourseFilter = (course) => {
    setSelectedCourse(course);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Pagination handlers
  const goToPage = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const delta = 2;
    const pages = [];
    const start = Math.max(1, currentPage - delta);
    const end = Math.min(totalPages, currentPage + delta);

    if (start > 1) {
      pages.push(1);
      if (start > 2) pages.push('...');
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages) {
      if (end < totalPages - 1) pages.push('...');
      pages.push(totalPages);
    }

    return pages;
  };

  if (loading) {
    return (
      <div className="assessment-page-container">
        <div className="loading-spinner">Loading assessments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assessment-page-container">
        <div className="error-message">{error}</div>
        {!isPremium && (
          <div className="premium-upsell">
            <h3>Want access to past papers and assessments?</h3>
            <p>Upgrade to premium membership for full access to our assessment database.</p>
            <a href="/upgrade" className="upgrade-btn">Upgrade Now</a>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="assessment-page-container">
      <div className="assessment-header">
  <h1>{userProgram || "Computer Science"} Assessments</h1>
  <p>Browse through past papers and assessments</p>
  {userProgram && <span className="program-badge">{userProgram}</span>}
</div>
      {/* Mobile Filter Toggle */}
      <div className="mobile-filter-toggle">
        <button 
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="filter-toggle-btn"
        >
          <span>🔍 Filters & Search</span>
          <span className={`arrow ${isMobileFiltersOpen ? 'open' : ''}`}>▼</span>
        </button>
      </div>

      {/* Filter Section */}
      <div className={`filter-section ${isMobileFiltersOpen ? 'mobile-open' : ''}`}>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by title, course name, or course code..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
        </div>

        <div className="filter-options">
          <div className="filter-group">
            <h3>Year Level:</h3>
            <select
              value={selectedYear}
              onChange={(e) => handleYearFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Years</option>
              <option value="1st year">1st Year</option>
              <option value="2nd year">2nd Year</option>
              <option value="3rd year">3rd Year</option>
              <option value="4th year">4th Year</option>
            </select>
          </div>

          <div className="filter-group">
            <h3>Course:</h3>
            <select
              value={selectedCourse}
              onChange={(e) => handleCourseFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.id} - {course.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="results-summary">
        <div className="results-info">
          Showing {startIndex + 1}-{Math.min(endIndex, filteredAssessments.length)} of {filteredAssessments.length} assessments
        </div>
        
        <div className="items-per-page">
          <label>
            Show: 
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="page-size-select"
            >
              <option value={6}>6</option>
              <option value={12}>12</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
            per page
          </label>
        </div>
      </div>

      {/* Assessments Grid */}
      <div className="assessments-grid">
        {currentAssessments.length > 0 ? (
          currentAssessments.map((assessment) => (
            <div className="assessment-card" key={assessment.id}>
              <div className="assessment-card-header">
                <h3>{assessment.assessmentTitle}</h3>
                <span className="assessment-year">{assessment.targetAudience}</span>
              </div>
              <div className="assessment-card-body">
                <p className="course-info">
                  <span className="course-code">{assessment.courseId}</span> - 
                  <span className="course-name">{assessment.courseName}</span>
                </p>
                <p className="program-info">{assessment.program}</p>
              </div>
              <div className="assessment-card-footer">
                <a 
                  href={assessment.url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="download-btn"
                >
                  View Assessment
                </a>
              </div>
            </div>
          ))
        ) : (
          <div className="no-assessments-message">
            <div className="no-results-icon">🔍</div>
            <h3>No assessments found</h3>
            <p>Try adjusting your search terms or filters to find what you're looking for.</p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedYear("all");
                setSelectedCourse("all");
                setCurrentPage(1);
              }}
              className="clear-filters-btn"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination-container">
          <div className="pagination-info">
            Page {currentPage} of {totalPages}
          </div>
          
          <div className="pagination-controls">
            {/* Previous button */}
            <button
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
            >
              <span className="pagination-arrow">‹</span>
              <span className="pagination-text">Previous</span>
            </button>

            {/* Page numbers for desktop */}
            <div className="pagination-numbers">
              {getPageNumbers().map((page, index) => (
                <button
                  key={index}
                  onClick={() => typeof page === 'number' && goToPage(page)}
                  disabled={page === '...'}
                  className={`pagination-number ${
                    page === currentPage ? 'active' : ''
                  } ${page === '...' ? 'ellipsis' : ''}`}
                >
                  {page}
                </button>
              ))}
            </div>

            {/* Mobile page input */}
            <div className="mobile-page-input">
              <input
                type="number"
                min="1"
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const page = parseInt(e.target.value);
                  if (page >= 1 && page <= totalPages) {
                    goToPage(page);
                  }
                }}
                className="page-input"
              />
              <span className="page-total">of {totalPages}</span>
            </div>

            {/* Next button */}
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
            >
              <span className="pagination-text">Next</span>
              <span className="pagination-arrow">›</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssessmentDisplay;
