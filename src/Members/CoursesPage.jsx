import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CourseData from "./Course&UserData/courses";
import PremiumUserData from "./Course&UserData/userData.jsx";
import "../Styles/CoursePage.css";

const CoursePageDisplay = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [selectedYear, setSelectedYear] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const userEmail = localStorage.getItem("userEmail");

        const userDataService = new PremiumUserData(userId, userEmail);
        await userDataService.verifyUser();
        
        const newemail = userDataService.getEmail();
        const newuid = userDataService.getUiD();
        
        const courseDataService = new CourseData(newuid, newemail);
        const coursesData = await courseDataService.fetchCourses();
        
        // FIXED: Properly handle debug data
        //const debugData = courseDataService.debugCourseStructure();
        //console.log("courses debug data: ", debugData);
        
        // Optional: Get all courses for comparison
        const allCoursesData = await courseDataService.fetchAllCourses();
        console.log("all courses data: ", allCoursesData);

	console.log("courses data: ", coursesData);

        if (courseDataService.getError()) {
          setError(courseDataService.getError());
        } else {
          setCourses(coursesData);
          setFilteredCourses(coursesData);
        }
      } catch (err) {
        setError("Failed to load courses. Please try again.");
        console.error("Error loading courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  // Filter courses based on selected year
  useEffect(() => {
    if (selectedYear === "all") {
      setFilteredCourses(courses);
    } else {
      // Check if targetYears is an array and filter accordingly
      const filtered = courses.filter(course => {
        if (Array.isArray(course.targetYears)) {
          return course.targetYears.includes(selectedYear);
        } else if (course.targetYear) {
          // For backward compatibility with the previous structure
          return course.targetYear === selectedYear;
        } else if (typeof course.targetYears === 'string') {
          // Handle string targetYears
          return course.targetYears === selectedYear;
        }
        return false;
      });
      setFilteredCourses(filtered);
    }
  }, [selectedYear, courses]);

  // Handle year filter change
  const handleYearFilter = (year) => {
    setSelectedYear(year);
  };

  // Handle course click - navigate to CourseViewer
  const handleCourseClick = (courseId) => {
    navigate(`/course/${courseId}`);
  };

  if (loading) {
    return (
      <div className="course-page-container">
        <div className="loading-spinner">Loading courses...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-page-container">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="course-page-container">
      <div className="course-header">
        <h1>Computer Science Courses</h1>
        <p>Browse through your available courses</p>
      </div>

      <div className="filter-section">
        <h3>Filter by Year:</h3>
        <div className="year-filters">
          <button
            className={`year-filter-btn ${selectedYear === "all" ? "active" : ""}`}
            onClick={() => handleYearFilter("all")}
          >
            All Years
          </button>
          <button
            className={`year-filter-btn ${selectedYear === "1st Year" ? "active" : ""}`}
            onClick={() => handleYearFilter("1st Year")}
          >
            1st Year
          </button>
          <button
            className={`year-filter-btn ${selectedYear === "2nd Year" ? "active" : ""}`}
            onClick={() => handleYearFilter("2nd Year")}
          >
            2nd Year
          </button>
          <button
            className={`year-filter-btn ${selectedYear === "3rd Year" ? "active" : ""}`}
            onClick={() => handleYearFilter("3rd Year")}
          >
            3rd Year
          </button>
          <button
            className={`year-filter-btn ${selectedYear === "4th Year" ? "active" : ""}`}
            onClick={() => handleYearFilter("4th Year")}
          >
            4th Year
          </button>
        </div>
      </div>

      <div className="courses-grid">
        {filteredCourses.length > 0 ? (
          filteredCourses.map((course) => (
            <div className="course-card" key={course.id}>
              <div className="course-card-header">
                <h3>{course.title}</h3>
                <span className="course-year">
                  {Array.isArray(course.targetYears) 
                    ? course.targetYears.join(", ") 
                    : course.targetYear || course.targetYears}
                </span>
              </div>
              <div className="course-card-body">
                <p className="course-code">{course.courseCode}</p>
                <div className="course-description" dangerouslySetInnerHTML={{ __html: course.description }}></div>
              </div>
              <div className="course-card-footer">
                <button 
                  onClick={() => handleCourseClick(course.id)} 
                  className="view-course-btn"
                >
                  View Course
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="no-courses-message">
            No courses available for the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePageDisplay;