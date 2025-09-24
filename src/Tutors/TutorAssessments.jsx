import React, { useState, useEffect } from 'react';
import { db } from '../AnA/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './styles/assessment.css';

const TutorAssessments = () => {
  const [assessments, setAssessments] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState(null);
  const [tutorData, setTutorData] = useState(null);
  const [formData, setFormData] = useState({
    assessmentTitle: '',
    courseId: '',
    courseName: '',
    program: '',
    targetAudience: '',
    url: ''
  });

  const auth = getAuth();

  useEffect(() => {
    fetchTutorData();
  }, []);

  const fetchTutorData = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        setError('User not authenticated');
        setLoading(false);
        return;
      }

      // Get tutor document
      const tutorDoc = await getDoc(doc(db, "tutors", user.uid));
      
      if (!tutorDoc.exists()) {
        setError("You don't have tutor privileges. Please contact an administrator.");
        setLoading(false);
        return;
      }

      const tutor = tutorDoc.data();
      setTutorData(tutor);
      
      // Get assigned courses
      const assignedCourseIds = tutor.assignedCourses || [];
      const coursesData = [];
      
      for (const courseId of assignedCourseIds) {
        try {
          const courseDoc = await getDoc(doc(db, "courses", courseId));
          if (courseDoc.exists()) {
            coursesData.push({
              id: courseDoc.id,
              ...courseDoc.data()
            });
          }
        } catch (err) {
          console.error(`Error fetching course ${courseId}:`, err);
        }
      }
      
      setAssignedCourses(coursesData);
      
      // Fetch assessments for assigned courses
      fetchAssessments(assignedCourseIds);
    } catch (err) {
      console.error("Error fetching tutor data:", err);
      setError('Failed to load tutor data');
      setLoading(false);
    }
  };

  const fetchAssessments = async (courseIds) => {
    try {
      const assessmentsCollection = collection(db, 'Assessments');
      const assessmentSnapshot = await getDocs(assessmentsCollection);
      const assessmentList = assessmentSnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .filter(assessment => courseIds.includes(assessment.courseId));
      
      setAssessments(assessmentList);
      setLoading(false);
    } catch (err) {
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

  const handleCourseChange = (e) => {
    const courseId = e.target.value;
    const selectedCourse = assignedCourses.find(course => course.id === courseId);
    
    setFormData({
      ...formData,
      courseId,
      courseName: selectedCourse ? selectedCourse.title : '',
      program: selectedCourse ? selectedCourse.targetPrograms?.join(', ') : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Verify the selected course is in the tutor's assigned courses
      const isAssignedCourse = assignedCourses.some(course => course.id === formData.courseId);
      
      if (!isAssignedCourse) {
        setError('You can only create assessments for courses assigned to you');
        return;
      }

      if (editingAssessment) {
        // Update existing assessment
        const assessmentRef = doc(db, 'Assessments', editingAssessment.id);
        await updateDoc(assessmentRef, formData);
      } else {
        // Add new assessment
        await addDoc(collection(db, 'Assessments'), {
          ...formData,
          createdBy: auth.currentUser.uid,
          createdAt: new Date()
        });
      }
      
      resetForm();
      fetchAssessments(assignedCourses.map(course => course.id));
    } catch (err) {
      setError(editingAssessment ? 'Failed to update assessment' : 'Failed to create assessment');
    }
  };

  const handleEdit = (assessment) => {
    setEditingAssessment(assessment);
    setFormData({
      assessmentTitle: assessment.assessmentTitle,
      courseId: assessment.courseId,
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
        fetchAssessments(assignedCourses.map(course => course.id));
      } catch (err) {
        setError('Failed to delete assessment');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      assessmentTitle: '',
      courseId: '',
      courseName: '',
      program: '',
      targetAudience: '',
      url: ''
    });
    setEditingAssessment(null);
    setShowForm(false);
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
          {showForm ? 'Cancel' : 'Add New Assessment'}
        </button>
      </div>

      {showForm && (
        <div className="assessment-form-container">
          <h2>{editingAssessment ? 'Edit Assessment' : 'Add New Assessment'}</h2>
          <form onSubmit={handleSubmit} className="assessment-form">
            <div className="form-group">
              <label htmlFor="assessmentTitle">Assessment Title</label>
              <input
                type="text"
                id="assessmentTitle"
                name="assessmentTitle"
                value={formData.assessmentTitle}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="courseId">Course</label>
              <select
                id="courseId"
                name="courseId"
                value={formData.courseId}
                onChange={handleCourseChange}
                required
              >
                <option value="">Select a course</option>
                {assignedCourses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="courseName">Course Name</label>
              <input
                type="text"
                id="courseName"
                name="courseName"
                value={formData.courseName}
                onChange={handleInputChange}
                readOnly
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="program">Program</label>
              <input
                type="text"
                id="program"
                name="program"
                value={formData.program}
                onChange={handleInputChange}
                readOnly
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="targetAudience">Target Audience</label>
              <input
                type="text"
                id="targetAudience"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="url">Assessment URL</label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingAssessment ? 'Update Assessment' : 'Create Assessment'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="results-summary">
        <div className="results-info">
          Showing {assessments.length} assessment{assessments.length !== 1 ? 's' : ''} for your assigned courses
        </div>
      </div>

      <ul className="assessments-grid">
        {assessments.length === 0 ? (
          <li className="no-assessments-message">
            <div className="no-results-icon">📋</div>
            <h3>No assessments found</h3>
            <p>Create your first assessment to get started</p>
          </li>
        ) : (
          assessments.map(assessment => (
            <li key={assessment.id} className="assessment-card">
              <div className="assessment-card-header">
                <h3>{assessment.assessmentTitle}</h3>
                <span className="assessment-year">
                  {new Date().getFullYear()}
                </span>
              </div>
              <div className="assessment-card-body">
                <p className="course-info">
                  <span className="course-code">{assessment.courseId}</span>
                  <span className="course-name">{assessment.courseName}</span>
                </p>
                <p className="program-info">
                  {assessment.program} - {assessment.targetAudience}
                </p>
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
                <div className="assessment-actions">
                  <button 
                    className="btn-edit" 
                    onClick={() => handleEdit(assessment)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(assessment.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default TutorAssessments;
