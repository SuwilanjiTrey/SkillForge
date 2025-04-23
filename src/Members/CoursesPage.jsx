import React, { useEffect, useState } from "react";
import CourseData from "./Course&UserData/courses";
import "../Styles/assessments.css";

const CoursePageDisplay = () => {
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

        const courseDataService = new CourseData(userId, userEmail);
        const coursesData = await courseDataService.fetchCourses();

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
      const filtered = courses.filter(
        (course) => course.targetYear === selectedYear
      );
      setFilteredCourses(filtered);
    }
  }, [selectedYear, courses]);

  // Handle year filter change
  const handleYearFilter = (year) => {
    setSelectedYear(year);
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
                <span className="course-year">{course.targetYear}</span>
              </div>
              <div className="course-card-body">
                <p className="course-code">{course.courseCode}</p>
                <p className="course-description">{course.description}</p>
              </div>
              <div className="course-card-footer">
                <a href={`/course/${course.id}`} className="view-course-btn">
                  View Course
                </a>
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