import React, { useState, useEffect } from 'react';
import { db, auth } from '../AnA/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import '../Styles/TutorialManagement.css';

const TutorTutorials = () => {
  const [tutorials, setTutorials] = useState([]);
  const [assignedCourses, setAssignedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingTutorial, setEditingTutorial] = useState(null);
  const [user, setUser] = useState(null);
  const [tutorData, setTutorData] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    meetLink: '',
    hostName: '',
    hostId: '',
    courseId: '',
    courseName: '',
    targetAudience: '',
    scheduledDate: '',
    duration: '',
    status: 'scheduled',
    accessLevel: 'all'
  });

  useEffect(() => {
    // Check authentication status
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setFormData(prev => ({
          ...prev,
          hostName: currentUser.displayName || '',
          hostId: currentUser.uid
        }));
        fetchTutorData(currentUser);
      } else {
        setError('You must be logged in to manage tutorials');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchTutorData = async (currentUser) => {
    try {
      // Get tutor document
      const tutorDoc = await getDoc(doc(db, "tutors", currentUser.uid));
      
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
      
      // Fetch tutorials created by this tutor
      fetchTutorials(currentUser.uid);
    } catch (err) {
      console.error("Error fetching tutor data:", err);
      setError('Failed to load tutor data');
      setLoading(false);
    }
  };

  const fetchTutorials = async (userId) => {
    try {
      const tutorialsQuery = query(
        collection(db, 'liveSessions'),
        where('createdBy', '==', userId)
      );
      
      const tutorialSnapshot = await getDocs(tutorialsQuery);
      const tutorialList = tutorialSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter to only show active tutorials (not completed)
      const activeTutorials = tutorialList.filter(
        tutorial => tutorial.status !== 'completed'
      );
      
      setTutorials(activeTutorials);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch tutorials');
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
      targetAudience: selectedCourse ? selectedCourse.targetYears?.join(', ') : ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Verify the selected course is in the tutor's assigned courses
      const isAssignedCourse = assignedCourses.some(course => course.id === formData.courseId);
      
      if (!isAssignedCourse) {
        setError('You can only create tutorials for courses assigned to you');
        return;
      }

      const tutorialData = {
        ...formData,
        createdBy: user.uid,
        createdAt: editingTutorial ? editingTutorial.createdAt : new Date(),
        updatedAt: new Date(),
        active: formData.status === 'live' // Set active based on status
      };

      if (editingTutorial) {
        // Update existing tutorial
        const tutorialRef = doc(db, 'liveSessions', editingTutorial.id);
        await updateDoc(tutorialRef, tutorialData);
      } else {
        // Add new tutorial
        await addDoc(collection(db, 'liveSessions'), tutorialData);
      }
      
      resetForm();
      fetchTutorials(user.uid);
    } catch (err) {
      setError(editingTutorial ? 'Failed to update tutorial' : 'Failed to create tutorial');
    }
  };

  const handleEdit = (tutorial) => {
    setEditingTutorial(tutorial);
    setFormData({
      title: tutorial.title,
      description: tutorial.description,
      meetLink: tutorial.meetLink,
      hostName: tutorial.hostName,
      hostId: tutorial.hostId,
      courseId: tutorial.courseId,
      courseName: tutorial.courseName,
      targetAudience: tutorial.targetAudience,
      scheduledDate: tutorial.scheduledDate,
      duration: tutorial.duration,
      status: tutorial.status,
      accessLevel: tutorial.accessLevel
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this tutorial?')) {
      try {
        await deleteDoc(doc(db, 'liveSessions', id));
        fetchTutorials(user.uid);
      } catch (err) {
        setError('Failed to delete tutorial');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      meetLink: '',
      hostName: user?.displayName || '',
      hostId: user?.uid || '',
      courseId: '',
      courseName: '',
      targetAudience: '',
      scheduledDate: '',
      duration: '',
      status: 'scheduled',
      accessLevel: 'all'
    });
    setEditingTutorial(null);
    setShowForm(false);
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const tutorialRef = doc(db, 'liveSessions', id);
      await updateDoc(tutorialRef, {
        status: newStatus,
        active: newStatus === 'live',
        updatedAt: new Date()
      });
      fetchTutorials(user.uid);
    } catch (err) {
      setError('Failed to update tutorial status');
    }
  };

  if (loading) return <div className="loading-spinner">Loading tutorials...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="tutorial-management-container">
      <div className="dashboard-header">
        <h1>Live Tutorial Management</h1>
        <p>Manage your active live tutorials</p>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Create New Tutorial'}
        </button>
      </div>

      {showForm && (
        <div className="tutorial-form-container">
          <h2>{editingTutorial ? 'Edit Tutorial' : 'Create New Tutorial'}</h2>
          <form onSubmit={handleSubmit} className="tutorial-form">
            <div className="form-group">
              <label htmlFor="title">Tutorial Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows="4"
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="meetLink">Google Meet Link</label>
              <input
                type="url"
                id="meetLink"
                name="meetLink"
                value={formData.meetLink}
                onChange={handleInputChange}
                placeholder="https://meet.google.com/xxx-xxxx-xxx"
                required
              />
              <small className="form-help-text">
                Paste the full Google Meet URL here
              </small>
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
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="hostName">Host Name</label>
                <input
                  type="text"
                  id="hostName"
                  name="hostName"
                  value={formData.hostName}
                  onChange={handleInputChange}
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
                  placeholder="e.g., 3rd Year Students"
                  required
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="scheduledDate">Scheduled Date & Time</label>
                <input
                  type="datetime-local"
                  id="scheduledDate"
                  name="scheduledDate"
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="duration">Duration (minutes)</label>
                <input
                  type="text"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 60"
                />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleInputChange}
                  required
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="live">Live Now</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              
              <div className="form-group">
                <label htmlFor="accessLevel">Access Level</label>
                <select
                  id="accessLevel"
                  name="accessLevel"
                  value={formData.accessLevel}
                  onChange={handleInputChange}
                  required
                >
                  <option value="all">All Students</option>
                  <option value="specific">Specific Programs</option>
                  <option value="premium">Premium Only</option>
                </select>
              </div>
            </div>
            
            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingTutorial ? 'Update Tutorial' : 'Create Tutorial'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="tutorials-grid">
        {tutorials.length === 0 ? (
          <div className="no-tutorials-message">
            <h3>No active tutorials found</h3>
            <p>Create your first tutorial to get started</p>
          </div>
        ) : (
          tutorials.map(tutorial => (
            <div key={tutorial.id} className="tutorial-card">
              <div className="tutorial-card-header">
                <h3>{tutorial.title}</h3>
                <span className={`tutorial-status ${tutorial.status}`}>
                  {tutorial.status === 'live' ? 'LIVE NOW' : tutorial.status.toUpperCase()}
                </span>
              </div>
              <div className="tutorial-card-body">
                <p className="tutorial-description">{tutorial.description}</p>
                <div className="tutorial-meta">
                  <div className="meta-item">
                    <span className="meta-label">Host:</span>
                    <span className="meta-value">{tutorial.hostName}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Course:</span>
                    <span className="meta-value">{tutorial.courseName}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Scheduled:</span>
                    <span className="meta-value">
                      {new Date(tutorial.scheduledDate).toLocaleString()}
                    </span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Access:</span>
                    <span className="meta-value">{tutorial.accessLevel}</span>
                  </div>
                </div>
              </div>
              <div className="tutorial-card-footer">
                <div className="status-actions">
                  {tutorial.status !== 'live' && (
                    <button 
                      className="btn-go-live"
                      onClick={() => updateStatus(tutorial.id, 'live')}
                    >
                      Go Live
                    </button>
                  )}
                  {tutorial.status === 'live' && (
                    <button 
                      className="btn-end-live"
                      onClick={() => updateStatus(tutorial.id, 'completed')}
                    >
                      End Session
                    </button>
                  )}
                </div>
                <div className="card-actions">
                  <button 
                    className="btn-edit" 
                    onClick={() => handleEdit(tutorial)}
                  >
                    Edit
                  </button>
                  <button 
                    className="btn-delete" 
                    onClick={() => handleDelete(tutorial.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TutorTutorials;
