// src/components/admin/CourseDashboard.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../AnA/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import './styles/coursedashboard.css';



const CourseDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('details'); // 'details' or 'modules'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetPrograms: [''],
    targetYears: [''],
    modules: []
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesCollection = collection(db, 'courses');
      const courseSnapshot = await getDocs(coursesCollection);
      const courseList = courseSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setCourses(courseList);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch courses');
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

  const handleArrayChange = (e, field, index) => {
    const { value } = e.target;
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData({
      ...formData,
      [field]: newArray
    });
  };

  const addArrayField = (field) => {
    setFormData({
      ...formData,
      [field]: [...formData[field], '']
    });
  };

  const removeArrayField = (field, index) => {
    const newArray = [...formData[field]];
    newArray.splice(index, 1);
    setFormData({
      ...formData,
      [field]: newArray
    });
  };

  // Module management functions
  const addModule = () => {
    const newModule = {
      id: Date.now().toString(),
      title: '',
      order: formData.modules.length + 1,
      content: []
    };
    setFormData({
      ...formData,
      modules: [...formData.modules, newModule]
    });
  };

  const removeModule = (index) => {
    const newModules = [...formData.modules];
    newModules.splice(index, 1);
    // Update order for remaining modules
    const updatedModules = newModules.map((module, i) => ({
      ...module,
      order: i + 1
    }));
    setFormData({
      ...formData,
      modules: updatedModules
    });
  };

  const handleModuleChange = (index, field, value) => {
    const newModules = [...formData.modules];
    newModules[index] = {
      ...newModules[index],
      [field]: value
    };
    setFormData({
      ...formData,
      modules: newModules
    });
  };

  // Content management functions
  const addContent = (moduleIndex) => {
    const newContent = {
      id: Date.now().toString(),
      title: '',
      description: '',
      type: 'document',
      url: ''
    };
    const newModules = [...formData.modules];
    newModules[moduleIndex].content = [...newModules[moduleIndex].content, newContent];
    setFormData({
      ...formData,
      modules: newModules
    });
  };

  const removeContent = (moduleIndex, contentIndex) => {
    const newModules = [...formData.modules];
    newModules[moduleIndex].content.splice(contentIndex, 1);
    setFormData({
      ...formData,
      modules: newModules
    });
  };

  const handleContentChange = (moduleIndex, contentIndex, field, value) => {
    const newModules = [...formData.modules];
    newModules[moduleIndex].content[contentIndex] = {
      ...newModules[moduleIndex].content[contentIndex],
      [field]: value
    };
    setFormData({
      ...formData,
      modules: newModules
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const courseData = {
        ...formData,
        createdAt: editingCourse ? editingCourse.createdAt : new Date(),
        updatedAt: new Date()
      };

      if (editingCourse) {
        // Update existing course
        const courseRef = doc(db, 'courses', editingCourse.id);
        await updateDoc(courseRef, courseData);
      } else {
        // Add new course
        await addDoc(collection(db, 'courses'), courseData);
      }
      resetForm();
      fetchCourses();
    } catch (err) {
      setError(editingCourse ? 'Failed to update course' : 'Failed to create course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      targetPrograms: course.targetPrograms,
      targetYears: course.targetYears,
      modules: course.modules
    });
    setShowForm(true);
    setActiveTab('details');
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteDoc(doc(db, 'courses', id));
        fetchCourses();
      } catch (err) {
        setError('Failed to delete course');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetPrograms: [''],
      targetYears: [''],
      modules: []
    });
    setEditingCourse(null);
    setShowForm(false);
    setActiveTab('details');
  };

  if (loading) return <div className="loading-spinner">Loading courses...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="course-dashboard-container">
      <div className="dashboard-header">
        <h1>Course Management</h1>
        <button 
          className="btn-primary" 
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Cancel' : 'Add New Course'}
        </button>
      </div>

      {showForm && (
        <div className="course-form-container">
          <div className="form-tabs">
            <button 
              className={`tab-btn ${activeTab === 'details' ? 'active' : ''}`}
              onClick={() => setActiveTab('details')}
            >
              Course Details
            </button>
            <button 
              className={`tab-btn ${activeTab === 'modules' ? 'active' : ''}`}
              onClick={() => setActiveTab('modules')}
            >
              Modules & Content
            </button>
          </div>

          <form onSubmit={handleSubmit} className="course-form">
            {activeTab === 'details' && (
              <>
                <div className="form-group">
                  <label htmlFor="title">Course Title</label>
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
                  <label>Target Programs</label>
                  {formData.targetPrograms.map((program, index) => (
                    <div key={index} className="array-input">
                      <input
                        type="text"
                        value={program}
                        onChange={(e) => handleArrayChange(e, 'targetPrograms', index)}
                        required
                      />
                      <button 
                        type="button" 
                        className="btn-remove"
                        onClick={() => removeArrayField('targetPrograms', index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="btn-add"
                    onClick={() => addArrayField('targetPrograms')}
                  >
                    Add Program
                  </button>
                </div>
                
                <div className="form-group">
                  <label>Target Years</label>
                  {formData.targetYears.map((year, index) => (
                    <div key={index} className="array-input">
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => handleArrayChange(e, 'targetYears', index)}
                        required
                      />
                      <button 
                        type="button" 
                        className="btn-remove"
                        onClick={() => removeArrayField('targetYears', index)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button 
                    type="button" 
                    className="btn-add"
                    onClick={() => addArrayField('targetYears')}
                  >
                    Add Year
                  </button>
                </div>
              </>
            )}

            {activeTab === 'modules' && (
              <div className="modules-section">
                <div className="section-header">
                  <h3>Course Modules</h3>
                  <button 
                    type="button" 
                    className="btn-add"
                    onClick={addModule}
                  >
                    Add Module
                  </button>
                </div>

                {formData.modules.map((module, moduleIndex) => (
                  <div key={module.id} className="module-card">
                    <div className="module-header">
                      <h4>Module {moduleIndex + 1}</h4>
                      <button 
                        type="button" 
                        className="btn-remove"
                        onClick={() => removeModule(moduleIndex)}
                      >
                        Remove Module
                      </button>
                    </div>

                    <div className="form-group">
                      <label>Module Title</label>
                      <input
                        type="text"
                        value={module.title}
                        onChange={(e) => handleModuleChange(moduleIndex, 'title', e.target.value)}
                        required
                      />
                    </div>

                    <div className="content-section">
                      <div className="section-header">
                        <h5>Content Items</h5>
                        <button 
                          type="button" 
                          className="btn-add"
                          onClick={() => addContent(moduleIndex)}
                        >
                          Add Content
                        </button>
                      </div>

                      {module.content.map((content, contentIndex) => (
                        <div key={content.id} className="content-item">
                          <div className="content-header">
                            <span>Content {contentIndex + 1}</span>
                            <button 
                              type="button" 
                              className="btn-remove"
                              onClick={() => removeContent(moduleIndex, contentIndex)}
                            >
                              Remove
                            </button>
                          </div>

                          <div className="form-group">
                            <label>Title</label>
                            <input
                              type="text"
                              value={content.title}
                              onChange={(e) => handleContentChange(moduleIndex, contentIndex, 'title', e.target.value)}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Description</label>
                            <textarea
                              value={content.description}
                              onChange={(e) => handleContentChange(moduleIndex, contentIndex, 'description', e.target.value)}
                              rows="2"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Type</label>
                            <select
                              value={content.type}
                              onChange={(e) => handleContentChange(moduleIndex, contentIndex, 'type', e.target.value)}
                              required
                            >
                              <option value="document">Document</option>
                              <option value="video">Video</option>
                              <option value="image">Image</option>
                              <option value="quiz">Quiz</option>
                              <option value="assignment">Assignment</option>
                            </select>
                          </div>

                          <div className="form-group">
                            <label>URL</label>
                            <input
                              type="url"
                              value={content.url}
                              onChange={(e) => handleContentChange(moduleIndex, contentIndex, 'url', e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {formData.modules.length === 0 && (
                  <div className="no-modules-message">
                    <p>No modules added yet. Click "Add Module" to get started.</p>
                  </div>
                )}
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="btn-primary">
                {editingCourse ? 'Update Course' : 'Create Course'}
              </button>
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="no-courses-message">
            <h3>No courses found</h3>
            <p>Create your first course to get started</p>
          </div>
        ) : (
          courses.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-card-header">
                <h3>{course.title}</h3>
                <span className="course-date">
                  {new Date(course.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="course-card-body">
                <p className="course-description">{course.description}</p>
                <div className="course-meta">
                  <div className="course-programs">
                    <strong>Programs:</strong> {course.targetPrograms.join(', ')}
                  </div>
                  <div className="course-years">
                    <strong>Years:</strong> {course.targetYears.join(', ')}
                  </div>
                  <div className="course-modules">
                    <strong>Modules:</strong> {course.modules.length}
                  </div>
                </div>
              </div>
              <div className="course-card-footer">
                <button 
                  className="btn-edit" 
                  onClick={() => handleEdit(course)}
                >
                  Edit
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => handleDelete(course.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CourseDashboard;
