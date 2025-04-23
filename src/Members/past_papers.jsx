import React, { useEffect, useState } from "react";
import AssessmentData from "./Course&UserData/assessmentData.jsx";
import PremiumUserData from "./Course&UserData/userData.jsx";
import "../Styles/assessments.css";
import { getAuth } from "firebase/auth";

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

        // Debug logs
        console.log("User data loaded:", userDataService.getUserData());
        console.log("User role:", userDataService.getRole());
        console.log("Is premium by role check:", userDataService.isPremiumMember());

        setIsPremium(userDataService.isPremiumMember());
        
        // Only fetch assessments if user is premium
        if (userDataService.isPremiumMember()) {
          // Initialize AssessmentData service
          const assessmentService = new AssessmentData(userId, userEmail);
          
          if (assessmentService.getError()) {
            setError(assessmentService.getError());
            setLoading(false);
            return;
          }
          
          // Fetch assessments
          const assessmentsList = await assessmentService.fetchAssessments();
          
          if (assessmentService.getError()) {
            setError(assessmentService.getError());
            setLoading(false);
            return;
          }
          
          console.log("Assessments loaded:", assessmentsList);
          
          setAssessments(assessmentsList);
          setFilteredAssessments(assessmentsList);
          
          // Extract unique course IDs for filter dropdown
          const uniqueCourses = [...new Set(assessmentsList.map(item => item.courseId))];
          setCourses(uniqueCourses);
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

  // Filter assessments based on selected filters and search
  useEffect(() => {
    let filtered = [...assessments];

    // Filter by year
    if (selectedYear !== "all") {
      filtered = filtered.filter(
        (assessment) => assessment.targetAudience === selectedYear
      );
    }

    // Filter by course
    if (selectedCourse !== "all") {
      filtered = filtered.filter(
        (assessment) => assessment.courseId === selectedCourse
      );
    }

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (assessment) =>
          assessment.assessmentTitle.toLowerCase().includes(term) ||
          assessment.courseName.toLowerCase().includes(term)
      );
    }

    setFilteredAssessments(filtered);
  }, [selectedYear, selectedCourse, searchTerm, assessments]);

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
        <h1>Computer Science Assessments</h1>
        <p>Browse through past papers and assessments</p>
      </div>

      <div className="filter-section">
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search by title or course name..."
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
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="assessments-grid">
        {filteredAssessments.length > 0 ? (
          filteredAssessments.map((assessment) => (
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
            No assessments available for the selected filters.
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentDisplay;