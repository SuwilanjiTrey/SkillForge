// src/components/tutor/TutorAssessments.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../AnA/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { 
  FileText, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  X,
  Save,
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import './styles/assessment.css';

const TutorAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [availableTargetYears, setAvailableTargetYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [tutorData, setTutorData] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    courseId: '', // This is the course code (e.g., "CSC 2000"), not the UID
    courseName: '',
    program: '',
    targetAudience: '',
    url: ''
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [message, setMessage] = useState({ text: '', type: '' });

  const auth = getAuth();

  useEffect(() => {
    fetchTutorData();
  }, []);

  useEffect(() => {
    // Filter assessments based on search term and selected course
    if (assessments.length > 0) {
      const filtered = assessments.filter(assessment => {
        const matchesSearch = searchTerm === '' || 
          (assessment.title && assessment.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (assessment.courseName && assessment.courseName.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesCourse = selectedCourse === '' || 
          (assessment.courseName && assessment.courseName.toLowerCase() === selectedCourse.toLowerCase());
        
        return matchesSearch && matchesCourse;
      });
      
      setFilteredAssessments(filtered);
    } else {
      setFilteredAssessments(assessments);
    }
  }, [assessments, searchTerm, selectedCourse]);

  /**
   * ALGORITHM: Fetch Tutor Data and Build Course Relationships
   * 
   * Step 1: Get tutor document from Firestore using current user's UID
   * Step 2: Extract assignedCourses array (contains course UIDs)
   * Step 3: For each UID in assignedCourses:
   *         - Fetch the course document from 'courses' collection
   *         - Extract the 'title' field (this is the courseName)
   *         - Store course data with both UID and title
   * Step 4: Pass course data to fetchAssessments algorithm
   */
  const fetchTutorData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // STEP 1: Get tutor document
      const tutorDoc = await getDoc(doc(db, "tutors", user.uid));
      
      if (!tutorDoc.exists()) {
        setError("You don't have tutor privileges. Please contact an administrator.");
        setLoading(false);
        return;
      }

      const tutor = tutorDoc.data();
      setTutorData(tutor);
      
      // STEP 2: Extract assignedCourses array (UIDs)
      const assignedCourseUIDs = tutor.assignedCourses || [];
      const coursesData = [];
      
      // STEP 3: Fetch each course and extract the 'title' field
      for (const courseUID of assignedCourseUIDs) {
        try {
          const courseDoc = await getDoc(doc(db, "courses", courseUID));
          if (courseDoc.exists()) {
            coursesData.push({
              id: courseDoc.id,
              ...courseDoc.data()
            });
          }
        } catch (err) {
          console.error(`Error fetching course ${courseUID}:`, err);
        }
      }
      
      setAssignedCourses(coursesData);
      
      // Extract unique target years from all assigned courses
      const allTargetYears = new Set();
      coursesData.forEach(course => {
        if (course.targetYears && Array.isArray(course.targetYears)) {
          course.targetYears.forEach(year => allTargetYears.add(year));
        }
      });
      
      // Convert Set to sorted array
      const targetYearsArray = Array.from(allTargetYears).sort();
      setAvailableTargetYears(targetYearsArray);
      console.log("Available target years:", targetYearsArray);
      
      // STEP 4: Fetch assessments using course data
      await fetchAssessments(coursesData);
      
    } catch (err) {
      console.error("Error fetching tutor data:", err);
      setError('Failed to load tutor data');
      setLoading(false);
    }
  };

  /**
   * ALGORITHM: Fetch Related Assessments by Course Name Matching (Case-Insensitive)
   * 
   * Step 1: Get all assessments from 'Assessments' collection
   * Step 2: Extract course titles from coursesData and convert to lowercase for comparison
   * Step 3: For each assessment:
   *         - Convert assessment.courseName to lowercase
   *         - Compare with lowercase course titles
   *         - If match found, include assessment in results
   * Step 4: Update state with filtered assessments
   * 
   * Note: Case conversion is done only in frontend for comparison, database remains unchanged
   * 
   * @param {Array} coursesData - Array of course objects with 'title' field from courses collection
   */
  const fetchAssessments = async (coursesData) => {
    try {
      const assessmentsCollection = collection(db, 'Assessments');
      const assessmentSnapshot = await getDocs(assessmentsCollection);
      const assessmentList = [];
      
      // STEP 2: Extract all course titles and convert to lowercase for comparison
      const assignedCourseTitlesLower = coursesData.map(course => course.title.toLowerCase());
      
      console.log("Assigned course titles (lowercase):", assignedCourseTitlesLower);
      
      // STEP 3: Filter assessments by comparing courseName with course titles (case-insensitive)
      assessmentSnapshot.forEach(docSnapshot => {
        const assessment = {
          id: docSnapshot.id,
          ...docSnapshot.data()
        };
        
        // Check if assessment.courseName matches any course.title (case-insensitive)
        const assessmentCourseNameLower = assessment.courseName?.toLowerCase() || '';
        const isRelated = assignedCourseTitlesLower.includes(assessmentCourseNameLower);
        
        console.log(`Assessment "${assessment.title}" - courseName: "${assessment.courseName}" - Match: ${isRelated}`);
        
        if (isRelated) {
          assessmentList.push(assessment);
        }
      });
      
      // STEP 4: Update state
      setAssessments(assessmentList);
      setFilteredAssessments(assessmentList);
      console.log("Filtered assessments list:", assessmentList);
      setLoading(false);
      
    } catch (err) {
      console.error("Error fetching assessments:", err);
      setError('Failed to fetch assessments');
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  /**
   * Handle course selection and auto-populate related fields
   * When a course is selected, automatically fill courseName and program
   * courseId (course code) is left for tutor to manually enter
   */
  const handleCourseChange = (e) => {
    const selectedCourseId = e.target.value;
    const selectedCourse = assignedCourses.find(course => course.id === selectedCourseId);
    
    if (selectedCourse) {
      setFormData({
        ...formData,
        courseId: '', // Clear courseId so tutor can enter course code manually
        courseName: selectedCourse.title, // Preserve exact case from database
        program: selectedCourse.targetPrograms?.join(', ') || ''
      });
    }
  };

  /**
   * ALGORITHM: Create/Update Assessment with Course Code and Exact CourseName
   * 
   * When creating/updating:
   * - courseId is the course code (e.g., "CSC 2000") entered by tutor, not the UID
   * - courseName is exact case from database
   * - id field is added as a unique identifier (matching Firestore document ID)
   * - This ensures proper data structure matching existing assessments
   * 
   * Validation uses case-insensitive comparison to ensure tutor has access
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Verify the selected course is in the tutor's assigned courses (case-insensitive check)
      const isAssignedCourse = assignedCourses.some(course => 
        course.title.toLowerCase() === formData.courseName.toLowerCase()
      );
      
      if (!isAssignedCourse) {
        setError('You can only create assessments for courses assigned to you');
        setMessage({ text: 'You can only create assessments for courses assigned to you', type: 'error' });
        return;
      }

      // Create assessment object with course code and exact courseName from database
      const assessmentData = {
        assessmentTitle: formData.title,
        courseId: formData.courseId, // Store course code (e.g., "CSC 2000")
        courseName: formData.courseName, // Store exact courseName with original case
        program: formData.program,
        targetAudience: formData.targetAudience,
        url: formData.url,
        createdBy: auth.currentUser.uid,
        createdAt: new Date()
      };

      if (editingAssessment) {
        // Update existing assessment
        const assessmentRef = doc(db, 'Assessments', editingAssessment.id);
        await updateDoc(assessmentRef, {
          ...assessmentData,
          id: editingAssessment.id // Keep the existing id field
        });
        setMessage({ text: 'Assessment updated successfully', type: 'success' });
      } else {
        // Add new assessment with course code and courseName
        const docRef = await addDoc(collection(db, 'Assessments'), assessmentData);
        
        // Update the document to include the id field matching the Firestore document ID
        await updateDoc(docRef, {
          id: docRef.id
        });
        
        setMessage({ text: 'Assessment created successfully', type: 'success' });
      }
      
      resetForm();
      // Refresh assessments list
      fetchAssessments(assignedCourses);
      
    } catch (err) {
      console.error("Error creating/updating assessment:", err);
      setError(editingAssessment ? 'Failed to update assessment' : 'Failed to create assessment');
      setMessage({ text: editingAssessment ? 'Failed to update assessment' : 'Failed to create assessment', type: 'error' });
    }
  };

  const handleEdit = (assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      title: assessment.title,
      courseId: assessment.courseId || '', // May be empty in old assessments
      courseName: assessment.courseName,
      program: assessment.program,
      targetAudience: assessment.targetAudience,
      url: assessment.url
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this assessment?')) {
      try {
        await deleteDoc(doc(db, 'Assessments', id));
        setMessage({ text: 'Assessment deleted successfully', type: 'success' });
        fetchAssessments(assignedCourses);
      } catch (err) {
        setError('Failed to delete assessment');
        setMessage({ text: 'Failed to delete assessment', type: 'error' });
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      courseId: '',
      courseName: '',
      program: '',
      targetAudience: '',
      url: ''
    });
    setEditingAssessment(null);
    setShowForm(false);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCourseFilter = (e) => {
    setSelectedCourse(e.target.value);
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCourse('');
  };

  if (loading) return <div className="loading-spinner">Loading assessments...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="assessment-page-container">
      <div className="assessment-header">
        <h1>Assessment Management</h1>
        <p>Manage assessments for your assigned courses</p>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? <ArrowLeft size={16} /> : <Plus size={16} />}
          {showForm ? 'Back to Assessments' : 'Add New Assessment'}
        </button>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {showForm ? (
        <div className="assessment-form-container">
          <h2>{editingAssessment ? 'Edit Assessment' : 'Add New Assessment'}</h2>
          <form onSubmit={handleSubmit} className="assessment-form">
            <div className="form-group">
              <label htmlFor="title">Assessment Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter assessment title (e.g., 2020 Final Exam)"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="courseSelector">Select Course (to auto-populate)</label>
              <select
                id="courseSelector"
                name="courseSelector"
                onChange={handleCourseChange}
              >
                <option value="">Select a course</option>
                {assignedCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
              <small className="form-hint">Select to auto-fill course name and program</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="courseId">Course Code</label>
              <input
                type="text"
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={handleInputChange}
                placeholder="Enter course code (e.g., CSC 2000)"
                required
              />
              <small className="form-hint">Enter the course code manually</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="program">Program</label>
              <input
                type="text"
                id="program"
                name="program"
                value={formData.program}
                onChange={handleInputChange}
                placeholder="Program will be auto-populated"
                readOnly
                required
              />
              <small className="form-hint">Auto-populated based on selected course</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="targetAudience">Target Audience (Year)</label>
              <select
                id="targetAudience"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                required
              >
                <option value="">Select target year</option>
                {availableTargetYears.map(year => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <small className="form-hint">Available years from your assigned courses</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="url">Assessment URL</label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                placeholder="https://example.com/assessment"
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                <Save size={16} /> {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div className="assessment-controls">
            <div className="search-filter-container">
              <div className="search-container">
                <Search size={18} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search assessments..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className="search-input"
                />
              </div>
              
              <div className="filter-container">
                <Filter size={18} className="filter-icon" />
                <select
                  value={selectedCourse}
                  onChange={handleCourseFilter}
                  className="filter-select"
                >
                  <option value="">All Courses</option>
                  {assignedCourses.map(course => (
                    <option key={course.id} value={course.title}>
                      {course.title}
                    </option>
                  ))}
                </select>
                {(searchTerm || selectedCourse) && (
                  <button 
                    type="button" 
                    className="clear-filters"
                    onClick={clearFilters}
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
            
            <div className="results-summary">
              <div className="results-info">
                Showing {filteredAssessments.length} assessment{filteredAssessments.length !== 1 ? 's' : ''} 
                {selectedCourse && ` for "${selectedCourse}"`}
                {searchTerm && ` matching "${searchTerm}"`}
              </div>
            </div>
          </div>

          <div className="assessments-grid">
            {filteredAssessments.length === 0 ? (
              <div className="no-assessments-message">
                <FileText size={48} />
                <h3>No assessments found</h3>
                <p>
                  {selectedCourse || searchTerm 
                    ? 'Try adjusting your filters or create a new assessment'
                    : 'Create your first assessment to get started'
                  }
                </p>
                <button 
                  className="btn-primary"
                  onClick={() => setShowForm(true)}
                >
                  <Plus size={16} /> Create Assessment
                </button>
              </div>
            ) : (
              filteredAssessments.map(assessment => (
                <div key={assessment.id} className="assessment-card">
                  <div className="assessment-card-header">
                    <h3>{assessment.title || assessment.assessmentTitle || 'N/A'}</h3>
                    <div className="assessment-meta">
                      <span className="assessment-course">
                        <BookOpen size={14} />
                        {assessment.courseName}
                      </span>
                      <span className="assessment-program">
                        {assessment.program}
                      </span>
                    </div>
                  </div>
                  <div className="assessment-card-body">
                    <p className="assessment-info">
                      <span className="assessment-audience">
                        Target: {assessment.targetAudience}
                      </span>
                    </p>
                  </div>
                  <div className="assessment-card-footer">
                    <a 
                      href={assessment.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="assessment-link"
                    >
                      <ExternalLink size={16} />
                      View Assessment
                    </a>
                    <div className="assessment-actions">
                      <button 
                        className="btn-edit" 
                        onClick={() => handleEdit(assessment)}
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-delete" 
                        onClick={() => handleDelete(assessment.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default TutorAssessments;
