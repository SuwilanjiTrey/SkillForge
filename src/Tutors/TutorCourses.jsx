// src/components/tutor/TutorCourses.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../AnA/firebase';
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import {
  BookOpen,
  Video,
  FileText,
  Image,
  Edit,
  Trash2,
  X,
  Plus,
  Save,
  ChevronLeft,
  ArrowLeft,
  ExternalLink,
  Layers,
  Settings
} from 'lucide-react';
import './styles/coursedashboard.css';

const TutorCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [activeTab, setActiveTab] = useState('modules');
  const [courseOptions, setCourseOptions] = useState({
    programs: [],
    years: []
  });
  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [selectedYears, setSelectedYears] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetPrograms: [],
    targetYears: [],
    modules: []
  });
  const [previewContent, setPreviewContent] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'edit'

  const auth = getAuth();

  useEffect(() => {
    fetchCourseOptions();
    fetchAssignedCourses();
  }, []);

  const fetchCourseOptions = async () => {
    try {
      const optionsDoc = await getDoc(doc(db, "settings", "courseOptions"));
      
      if (optionsDoc.exists()) {
        const optionsData = optionsDoc.data();
        setCourseOptions({
          programs: optionsData.programs || [],
          years: optionsData.years || []
        });
      } else {
        setCourseOptions({
          programs: ["Computer Science", "Information Technology", "Software Engineering", "Data Science"],
          years: ["1st Year", "2nd Year", "3rd Year", "4th Year"]
        });
      }
    } catch (err) {
      console.error("Error fetching course options:", err);
      setCourseOptions({
        programs: ["Computer Science", "Information Technology", "Software Engineering", "Data Science"],
        years: ["1st Year", "2nd Year", "3rd Year", "4th Year"]
      });
    }
  };

  const fetchAssignedCourses = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      
      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      const tutorDoc = await getDoc(doc(db, "tutors", user.uid));
      
      if (!tutorDoc.exists()) {
        setError("Tutor document not found");
        setLoading(false);
        return;
      }

      const tutorData = tutorDoc.data();
      const assignedCourseIds = tutorData.assignedCourses || [];

      const coursesData = [];
      for (const courseId of assignedCourseIds) {
        const courseDoc = await getDoc(doc(db, "courses", courseId));
        if (courseDoc.exists()) {
          coursesData.push({
            id: courseDoc.id,
            ...courseDoc.data()
          });
        }
      }
      
      setCourses(coursesData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching courses:", err);
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
        updatedAt: new Date()
      };

      // Update only modules, not course details
      const courseRef = doc(db, 'courses', editingCourse.id);
      await updateDoc(courseRef, {
        modules: courseData.modules,
        updatedAt: new Date()
      });
      
      resetForm();
      fetchAssignedCourses();
      setViewMode('list');
    } catch (err) {
      setError('Failed to update course');
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setSelectedPrograms(course.targetPrograms || []);
    setSelectedYears(course.targetYears || []);
    setFormData({
      title: course.title,
      description: course.description,
      targetPrograms: course.targetPrograms || [],
      targetYears: course.targetYears || [],
      modules: course.modules || []
    });
    setViewMode('edit');
  };

  const resetForm = () => {
    setSelectedPrograms([]);
    setSelectedYears([]);
    setFormData({
      title: '',
      description: '',
      targetPrograms: [],
      targetYears: [],
      modules: []
    });
    setEditingCourse(null);
    setActiveTab('modules');
    setViewMode('list');
  };

  const handlePreviewContent = (content) => {
    setPreviewContent(content);
  };

  const closePreview = () => {
    setPreviewContent(null);
  };

  // Content Preview Component
  const ContentPreview = ({ content }) => {
    const [previewError, setPreviewError] = useState(false);

    const renderPreview = () => {
      if (previewError) {
        return (
          <div className="preview-error">
            <p>Preview not available</p>
            <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn-view-external">
              View in New Tab
            </a>
          </div>
        );
      }

      switch (content.type) {
        case 'document':
          if (content.url.toLowerCase().includes('.pdf')) {
            return (
              <div className="document-preview">
                <iframe 
                  src={content.url} 
                  title={content.title}
                  onError={() => setPreviewError(true)}
                />
              </div>
            );
          } else {
            return (
              <div className="document-preview">
                <div className="document-icon">
                  <FileText size={48} />
                  <p>{content.title}</p>
                </div>
                <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn-view-external">
                  View Document
                </a>
              </div>
            );
          }
          
        case 'video':
          if (content.url.includes('youtube.com') || content.url.includes('youtu.be')) {
            const videoId = content.url.includes('youtube.com') 
              ? content.url.split('v=')[1]?.split('&')[0]
              : content.url.split('/').pop();
              
            if (videoId) {
              return (
                <div className="video-preview">
                  <iframe 
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={content.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onError={() => setPreviewError(true)}
                  ></iframe>
                </div>
              );
            }
          }
          
          return (
            <div className="video-preview">
              <video 
                controls 
                onError={() => setPreviewError(true)}
              >
                <source src={content.url} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
          );
          
        case 'image':
          return (
            <div className="image-preview">
              <img 
                src={content.url} 
                alt={content.title}
                onError={() => setPreviewError(true)}
              />
            </div>
          );
          
        case 'quiz':
          return (
            <div className="quiz-preview">
              <div className="quiz-icon">
                <FileText size={48} />
                <p>{content.title}</p>
              </div>
              <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn-view-external">
                View Quiz
              </a>
            </div>
          );
          
        case 'assignment':
          return (
            <div className="assignment-preview">
              <div className="assignment-icon">
                <FileText size={48} />
                <p>{content.title}</p>
              </div>
              <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn-view-external">
                View Assignment
              </a>
            </div>
          );
          
        default:
          return (
            <div className="content-preview-placeholder">
              <p>No preview available for {content.type} content</p>
              <a href={content.url} target="_blank" rel="noopener noreferrer" className="btn-view-external">
                View Content
              </a>
            </div>
          );
      }
    };

    return (
      <div className="content-preview-container">
        <h4>Preview: {content.title}</h4>
        <div className="preview-content">
          {renderPreview()}
        </div>
      </div>
    );
  };

  if (loading) return <div className="loading-spinner">Loading courses...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="course-dashboard-container">
      {viewMode === 'list' ? (
        <>
          <div className="dashboard-header">
            <h1>Your Assigned Courses</h1>
            <p>Select a course to edit its modules and content</p>
          </div>

          <div className="courses-grid">
            {courses.length === 0 ? (
              <div className="no-courses-message">
                <BookOpen size={48} />
                <h3>No courses assigned to you</h3>
                <p>Contact an admin to get courses assigned to you</p>
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
                      <Edit size={16} /> Edit Modules
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          <div className="edit-header">
            <button 
              className="back-button"
              onClick={() => setViewMode('list')}
            >
              <ArrowLeft size={16} /> Back to Courses
            </button>
            <h2>Editing: {editingCourse?.title}</h2>
          </div>

          <div className="edit-container">
            <div className="edit-sidebar">
              <div className="sidebar-section">
                <h3>Course Details</h3>
                <div className="detail-item">
                  <label>Title</label>
                  <div className="detail-value">{editingCourse?.title}</div>
                </div>
                <div className="detail-item">
                  <label>Description</label>
                  <div className="detail-value">{editingCourse?.description}</div>
                </div>
                <div className="detail-item">
                  <label>Programs</label>
                  <div className="detail-tags">
                    {editingCourse?.targetPrograms?.map((program, index) => (
                      <span key={index} className="detail-tag">{program}</span>
                    ))}
                  </div>
                </div>
                <div className="detail-item">
                  <label>Years</label>
                  <div className="detail-tags">
                    {editingCourse?.targetYears?.map((year, index) => (
                      <span key={index} className="detail-tag">{year}</span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="sidebar-section">
                <h3>Quick Actions</h3>
                <div className="action-buttons">
                  <button 
                    className={`action-btn ${activeTab === 'modules' ? 'active' : ''}`}
                    onClick={() => setActiveTab('modules')}
                  >
                    <Layers size={16} /> Modules
                  </button>
                </div>
              </div>
            </div>

            <div className="edit-main">
              {activeTab === 'modules' && (
                <div className="modules-section">
                  <div className="section-header">
                    <h3>Course Modules</h3>
                    <button 
                      type="button" 
                      className="btn-add"
                      onClick={addModule}
                    >
                      <Plus size={16} /> Add Module
                    </button>
                  </div>

                  {formData.modules.length === 0 ? (
                    <div className="no-modules-message">
                      <Layers size={48} />
                      <p>No modules added yet. Click "Add Module" to get started.</p>
                    </div>
                  ) : (
                    <div className="modules-list">
                      {formData.modules.map((module, moduleIndex) => (
                        <div key={module.id} className="module-card">
                          <div className="module-header">
                            <h4>Module {moduleIndex + 1}</h4>
                            <button 
                              type="button" 
                              className="btn-remove"
                              onClick={() => removeModule(moduleIndex)}
                            >
                              <X size={16} />
                            </button>
                          </div>

                          <div className="form-group">
                            <label>Module Title</label>
                            <input
                              type="text"
                              value={module.title}
                              onChange={(e) => handleModuleChange(moduleIndex, 'title', e.target.value)}
                              placeholder="Enter module title"
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
                                <Plus size={14} /> Add Content
                              </button>
                            </div>

                            {module.content.length === 0 ? (
                              <div className="no-content-message">
                                <FileText size={24} />
                                <p>No content items added yet.</p>
                              </div>
                            ) : (
                              <div className="content-list">
                                {module.content.map((content, contentIndex) => (
                                  <div key={content.id} className="content-item">
                                    <div className="content-header">
                                      <div className="content-type-badge">
                                        {content.type === 'document' && <FileText size={14} />}
                                        {content.type === 'video' && <Video size={14} />}
                                        {content.type === 'image' && <Image size={14} />}
                                        {content.type === 'quiz' && <FileText size={14} />}
                                        {content.type === 'assignment' && <FileText size={14} />}
                                        {content.type}
                                      </div>
                                      <div className="content-actions">
                                        <button 
                                          type="button" 
                                          className="btn-preview"
                                          onClick={() => handlePreviewContent(content)}
                                        >
                                          Preview
                                        </button>
                                        <button 
                                          type="button" 
                                          className="btn-remove"
                                          onClick={() => removeContent(moduleIndex, contentIndex)}
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    </div>

                                    <div className="form-group">
                                      <label>Title</label>
                                      <input
                                        type="text"
                                        value={content.title}
                                        onChange={(e) => handleContentChange(moduleIndex, contentIndex, 'title', e.target.value)}
                                        placeholder="Enter content title"
                                        required
                                      />
                                    </div>

                                    <div className="form-group">
                                      <label>Description</label>
                                      <textarea
                                        value={content.description}
                                        onChange={(e) => handleContentChange(moduleIndex, contentIndex, 'description', e.target.value)}
                                        rows="2"
                                        placeholder="Enter content description"
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
                                        placeholder="Enter content URL"
                                        required
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="form-actions">
                <button type="submit" className="btn-primary" onClick={handleSubmit}>
                  <Save size={16} /> Update Course
                </button>
                <button type="button" className="btn-secondary" onClick={resetForm}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {previewContent && (
        <div className="preview-modal">
          <div className="preview-modal-content">
            <div className="preview-modal-header">
              <h3>Content Preview</h3>
              <button className="btn-close" onClick={closePreview}>
                <X size={18} />
              </button>
            </div>
            <div className="preview-modal-body">
              <ContentPreview content={previewContent} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorCourses;
