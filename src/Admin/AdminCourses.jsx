// src/components/admin/CourseDashboard.jsx
import React, { useState, useEffect } from 'react';
import { db } from '../AnA/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import './styles/coursedashboard.css';



// NEW: Program Manager Modal Component
const ProgramManagerModal = ({ isOpen, onClose, programs, onAddProgram, onDeleteProgram }) => {
  const [newProgram, setNewProgram] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newProgram.trim()) {
      setError('Program name cannot be empty');
      return;
    }

    // Check for duplicates (case insensitive)
    if (programs.some(p => p.name.toLowerCase() === newProgram.trim().toLowerCase())) {
      setError('This program already exists');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await onAddProgram(newProgram.trim());
      setNewProgram('');
      setLoading(false);
    } catch (err) {
      setError('Failed to add program');
      setLoading(false);
    }
  };

  const handleDelete = async (programId, programName) => {
    if (window.confirm(`Are you sure you want to delete "${programName}"? This action cannot be undone.`)) {
      try {
        await onDeleteProgram(programId);
      } catch (err) {
        setError('Failed to delete program');
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content program-manager-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Manage Programs</h3>
          <button className="btn-close" onClick={onClose}>×</button>
          
        </div>
        
        <div className="modal-body">
          <form onSubmit={handleSubmit} className="add-program-form">
            <div className="form-group">
              <label>Add New Program</label>
              <div className="input-with-button">
                <input
                  type="text"
                  value={newProgram}
                  onChange={(e) => setNewProgram(e.target.value)}
                  placeholder="e.g., Computer Science"
                  disabled={loading}
                />
                <button type="submit" className="btn-primary" disabled={loading}>
                  {loading ? 'Adding...' : 'Add'}
                </button>
              </div>
              {error && <span className="error-text">{error}</span>}
            </div>
          </form>

          <div className="programs-list">
            <h4>Existing Programs ({programs.length})</h4>
            {programs.length === 0 ? (
              <p className="empty-message">No programs added yet</p>
            ) : (
              <ul className="program-items">
                {programs.map((program) => (
                  <li key={program.id} className="program-item">
                    <span>{program.name}</span>
                    <button
                      className="btn-icon-remove"
                      onClick={() => handleDelete(program.id, program.name)}
                      title="Delete program"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

// Updated CourseList component with dynamic programs
const CourseList = ({ courses, loading, error, onEdit, onDelete, onManageModules, currentPage, setCurrentPage, filters, setFilters, programs, onManagePrograms }) => {
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const filteredCourses = courses.filter(course => {
    const programMatch = filters.program === '' || 
      course.targetPrograms.some(program => 
        program.toLowerCase().includes(filters.program.toLowerCase())
      );
    
    const yearMatch = filters.year === '' || 
      course.targetYears.some(year => 
        year.toLowerCase().includes(filters.year.toLowerCase())
      );
    
    const searchMatch = filters.search === '' || 
      course.title.toLowerCase().includes(filters.search.toLowerCase()) || 
      course.description.toLowerCase().includes(filters.search.toLowerCase());
    
    return programMatch && yearMatch && searchMatch;
  });

  const coursesPerPage = 6;
  const indexOfLastCourse = currentPage * coursesPerPage;
  const indexOfFirstCourse = indexOfLastCourse - coursesPerPage;
  const currentCourses = filteredCourses.slice(indexOfFirstCourse, indexOfLastCourse);
  const newTotalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  return (
    <div className="course-list-container">
      <div className="filters-container">
        <div className="filter-group">
          <div className="filter-label-with-button">
            <label htmlFor="program-filter">Filter by Program:</label>
            <button 
              className="btn-manage-programs"
              onClick={onManagePrograms}
              title="Manage Programs"
            >
              ⚙️
            </button>
          </div>
          <select
            id="program-filter"
            name="program"
            value={filters.program}
            onChange={handleFilterChange}
          >
            <option value="">All Programs</option>
            {programs.map(program => (
              <option key={program.id} value={program.name}>
                {program.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="year-filter">Filter by Year:</label>
          <select
            id="year-filter"
            name="year"
            value={filters.year}
            onChange={handleFilterChange}
          >
            <option value="">All Years</option>
            <option value="1st year">1st Year</option>
            <option value="2nd year">2nd Year</option>
            <option value="3rd year">3rd Year</option>
            <option value="4th year">4th Year</option>
            <option value="5th year">5th Year</option>
            <option value="6th year">6th Year</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="search-filter">Search:</label>
          <input
            type="text"
            id="search-filter"
            name="search"
            placeholder="Search courses..."
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>
        
        <div className="filter-actions">
          <button 
            className="btn-clear-filters"
            onClick={() => {
              setFilters({ program: '', year: '', search: '' });
              setCurrentPage(1);
            }}
          >
            Clear Filters
          </button>
        </div>
      </div>

      <div className="courses-grid">
        {loading ? (
          <div className="loading-spinner">Loading courses...</div>
        ) : error ? (
          <div className="error-message">{error}</div>
        ) : currentCourses.length === 0 ? (
          <div className="no-courses-message">
            <h3>No courses found</h3>
            <p>Try adjusting your filters or create a new course</p>
          </div>
        ) : (
          currentCourses.map(course => (
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
                  onClick={() => onEdit(course)}
                >
                  Edit Details
                </button>
                <button 
                  className="btn-modules" 
                  onClick={() => onManageModules(course)}
                >
                  Manage Modules
                </button>
                <button 
                  className="btn-delete" 
                  onClick={() => onDelete(course.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {newTotalPages > 1 && (
        <div className="pagination-container">
          <button 
            className="pagination-btn" 
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <div className="pagination-numbers">
            {Array.from({ length: newTotalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                className={`pagination-number ${currentPage === page ? 'active' : ''}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}
          </div>
          <button 
            className="pagination-btn" 
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, newTotalPages))}
            disabled={currentPage === newTotalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

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
                <i className="document-icon-symbol">📄</i>
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

// Updated CourseForm component with dynamic programs
const CourseForm = ({ course, onSubmit, onCancel, programs, onManagePrograms }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetPrograms: [],
    targetYears: []
  });

  const yearOptions = ["1st Year", "2nd Year", "3rd Year", "4th Year", "5th Year", "6th Year"];

  useEffect(() => {
    if (course) {
      setFormData({
        title: course.title,
        description: course.description,
        targetPrograms: course.targetPrograms,
        targetYears: course.targetYears
      });
    }
  }, [course]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleProgramChange = (program) => {
    const updatedPrograms = [...formData.targetPrograms];
    if (updatedPrograms.includes(program)) {
      const index = updatedPrograms.indexOf(program);
      updatedPrograms.splice(index, 1);
    } else {
      updatedPrograms.push(program);
    }
    setFormData({
      ...formData,
      targetPrograms: updatedPrograms
    });
  };

  const handleYearChange = (year) => {
    const updatedYears = [...formData.targetYears];
    if (updatedYears.includes(year)) {
      const index = updatedYears.indexOf(year);
      updatedYears.splice(index, 1);
    } else {
      updatedYears.push(year);
    }
    setFormData({
      ...formData,
      targetYears: updatedYears
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="course-form-container">
      <h2>{course ? 'Edit Course' : 'Add New Course'}</h2>
      <form onSubmit={handleSubmit} className="course-form">
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
          <div className="label-with-button">
            <label>Target Programs</label>
            <button 
              type="button"
              className="btn-add-small"
              onClick={onManagePrograms}
              title="Manage Programs"
            >
              + Add Program
            </button>
          </div>
          <div className="checkbox-container">
            {programs.length === 0 ? (
              <p className="empty-message">No programs available. Click "+ Add Program" to add one.</p>
            ) : (
              programs.map(program => (
                <div key={program.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`program-${program.id}`}
                    checked={formData.targetPrograms.includes(program.name)}
                    onChange={() => handleProgramChange(program.name)}
                  />
                  <label htmlFor={`program-${program.id}`}>{program.name}</label>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className="form-group">
          <label>Target Years</label>
          <div className="checkbox-container">
            {yearOptions.map(year => (
              <div key={year} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`year-${year}`}
                  checked={formData.targetYears.includes(year)}
                  onChange={() => handleYearChange(year)}
                />
                <label htmlFor={`year-${year}`}>{year}</label>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" className="btn-primary">
            {course ? 'Update Course' : 'Create Course'}
          </button>
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const ModuleManager = ({ course, onSave, onCancel }) => {
  const [modules, setModules] = useState([]);
  const [selectedModule, setSelectedModule] = useState(null);
  const [previewContent, setPreviewContent] = useState(null);

  useEffect(() => {
    if (course) {
      setModules(course.modules || []);
    }
  }, [course]);

  const addModule = () => {
    const newModule = {
      id: Date.now().toString(),
      title: '',
      order: modules.length + 1,
      content: []
    };
    setModules([...modules, newModule]);
  };

  const removeModule = (index) => {
    if (window.confirm('Are you sure you want to remove this module?')) {
      const newModules = [...modules];
      newModules.splice(index, 1);
      const updatedModules = newModules.map((module, i) => ({
        ...module,
        order: i + 1
      }));
      setModules(updatedModules);
      
      if (selectedModule && selectedModule.id === modules[index].id) {
        setSelectedModule(null);
      }
    }
  };

  const handleModuleChange = (index, field, value) => {
    const newModules = [...modules];
    newModules[index] = {
      ...newModules[index],
      [field]: value
    };
    setModules(newModules);
    
    if (selectedModule && selectedModule.id === newModules[index].id) {
      setSelectedModule(newModules[index]);
    }
  };

  const addContent = (moduleIndex) => {
    const newContent = {
      id: Date.now().toString(),
      title: '',
      description: '',
      type: 'document',
      url: ''
    };
    const newModules = [...modules];
    newModules[moduleIndex].content = [...newModules[moduleIndex].content, newContent];
    setModules(newModules);
    
    if (selectedModule && selectedModule.id === newModules[moduleIndex].id) {
      setSelectedModule(newModules[moduleIndex]);
    }
  };

  const removeContent = (moduleIndex, contentIndex) => {
    if (window.confirm('Are you sure you want to remove this content item?')) {
      const newModules = [...modules];
      newModules[moduleIndex].content.splice(contentIndex, 1);
      setModules(newModules);
      
      if (selectedModule && selectedModule.id === newModules[moduleIndex].id) {
        setSelectedModule(newModules[moduleIndex]);
      }
    }
  };

  const handleContentChange = (moduleIndex, contentIndex, field, value) => {
    const newModules = [...modules];
    newModules[moduleIndex].content[contentIndex] = {
      ...newModules[moduleIndex].content[contentIndex],
      [field]: value
    };
    setModules(newModules);
    
    if (selectedModule && selectedModule.id === newModules[moduleIndex].id) {
      setSelectedModule(newModules[moduleIndex]);
    }
  };

  const handleSave = () => {
    onSave({ ...course, modules });
  };

  const handlePreviewContent = (content) => {
    setPreviewContent(content);
  };

  const closePreview = () => {
    setPreviewContent(null);
  };

  return (
    <div className="module-manager-container">
      <div className="module-manager-header">
        <h2>Manage Modules for: {course?.title}</h2>
        <div className="header-actions">
          <button className="btn-primary" onClick={handleSave}>Save Changes</button>
          <button className="btn-secondary" onClick={onCancel}>Cancel</button>
        </div>
      </div>
      
      <div className="modules-layout">
        <div className="modules-list-section">
          <div className="section-header">
            <h3>Course Modules</h3>
            <button className="btn-add" onClick={addModule}>Add Module</button>
          </div>

          {modules.length === 0 ? (
            <div className="no-modules-message">
              <p>No modules added yet. Click "Add Module" to get started.</p>
            </div>
          ) : (
            <div className="modules-list">
              {modules.map((module, index) => (
                <div 
                  key={module.id} 
                  className={`module-list-item ${selectedModule?.id === module.id ? 'selected' : ''}`}
                  onClick={() => setSelectedModule(module)}
                >
                  <div className="module-list-header">
                    <h4>Module {index + 1}: {module.title || 'Untitled'}</h4>
                    <div className="module-list-actions">
                      <button 
                        className="btn-icon-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeModule(index);
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                  <div className="module-list-meta">
                    <span>{module.content.length} content items</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="module-content-section">
          {selectedModule ? (
            <>
              <div className="selected-module-header">
                <h3>Module: {selectedModule.title || 'Untitled'}</h3>
                <div className="module-title-edit">
                  <input
                    type="text"
                    value={selectedModule.title}
                    onChange={(e) => handleModuleChange(
                      modules.findIndex(m => m.id === selectedModule.id), 
                      'title', 
                      e.target.value
                    )}
                    placeholder="Module Title"
                  />
                </div>
              </div>

              <div className="content-section">
                <div className="section-header">
                  <h5>Content Items</h5>
                  <button 
                    className="btn-add" 
                    onClick={() => addContent(modules.findIndex(m => m.id === selectedModule.id))}
                  >
                    Add Content
                  </button>
                </div>

                {selectedModule.content.length === 0 ? (
                  <div className="no-content-message">
                    <p>No content items added yet. Click "Add Content" to get started.</p>
                  </div>
                ) : (
                  <div className="content-items-list">
                    {selectedModule.content.map((content, contentIndex) => (
                      <div key={content.id} className="content-item">
                        <div className="content-item-header">
                          <div className="content-type-badge">
                            {content.type}
                          </div>
                          <div className="content-item-actions">
                            <button 
                              className="btn-preview"
                              onClick={() => handlePreviewContent(content)}
                            >
                              Preview
                            </button>
                            <button 
                              className="btn-icon-remove"
                              onClick={() => removeContent(
                                modules.findIndex(m => m.id === selectedModule.id), 
                                contentIndex
                              )}
                            >
                              ×
                            </button>
                          </div>
                        </div>

                        <div className="content-item-details">
                          <div className="form-group">
                            <label>Title</label>
                            <input
                              type="text"
                              value={content.title}
                              onChange={(e) => handleContentChange(
                                modules.findIndex(m => m.id === selectedModule.id), 
                                contentIndex, 
                                'title', 
                                e.target.value
                              )}
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Description</label>
                            <textarea
                              value={content.description}
                              onChange={(e) => handleContentChange(
                                modules.findIndex(m => m.id === selectedModule.id), 
                                contentIndex, 
                                'description', 
                                e.target.value
                              )}
                              rows="2"
                              required
                            />
                          </div>

                          <div className="form-group">
                            <label>Type</label>
                            <select
                              value={content.type}
                              onChange={(e) => handleContentChange(
                                modules.findIndex(m => m.id === selectedModule.id), 
                                contentIndex, 
                                'type', 
                                e.target.value
                              )}
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
                              onChange={(e) => handleContentChange(
                                modules.findIndex(m => m.id === selectedModule.id), 
                                contentIndex, 
                                'url', 
                                e.target.value
                              )}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="select-module-prompt">
              <div className="prompt-icon">📚</div>
              <h3>Select a Module</h3>
              <p>Choose a module from the list to view and edit its content</p>
            </div>
          )}
        </div>
      </div>

      {previewContent && (
        <div className="preview-modal">
          <div className="preview-modal-content">
            <div className="preview-modal-header">
              <h3>Content Preview</h3>
              <button className="btn-close" onClick={closePreview}>×</button>
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

// Main component with programs management
const CourseDashboard = () => {
  const [courses, setCourses] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState({
    program: '',
    year: '',
    search: ''
  });
  const [isProgramModalOpen, setIsProgramModalOpen] = useState(false);
  
  const [currentView, setCurrentView] = useState('list');
  const [selectedCourse, setSelectedCourse] = useState(null);

  useEffect(() => {
    fetchCourses();
    fetchPrograms();
  }, []);

  const fetchPrograms = async () => {
    try {
      const programsCollection = collection(db, 'programs');
      const programsQuery = query(programsCollection, orderBy('name'));
      const programSnapshot = await getDocs(programsQuery);
      const programList = programSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPrograms(programList);
    } catch (err) {
      console.error('Failed to fetch programs:', err);
    }
  };

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

  const handleAddProgram = async (programName) => {
    try {
      await addDoc(collection(db, 'programs'), {
        name: programName,
        createdAt: new Date()
      });
      await fetchPrograms();
    } catch (err) {
      throw new Error('Failed to add program');
    }
  };

  const handleDeleteProgram = async (programId) => {
    try {
      await deleteDoc(doc(db, 'programs', programId));
      await fetchPrograms();
    } catch (err) {
      throw new Error('Failed to delete program');
    }
  };

  const handleEditCourse = (course) => {
    setSelectedCourse(course);
    setCurrentView('edit-course');
  };

  const handleAddCourse = () => {
    setSelectedCourse(null);
    setCurrentView('add-course');
  };

  const handleManageModules = (course) => {
    setSelectedCourse(course);
    setCurrentView('manage-modules');
  };

  const handleDeleteCourse = async (id) => {
    if (window.confirm('Are you sure you want to delete this course?')) {
      try {
        await deleteDoc(doc(db, 'courses', id));
        fetchCourses();
      } catch (err) {
        setError('Failed to delete course');
      }
    }
  };

  const handleSaveCourse = async (courseData) => {
    try {
      const data = {
        ...courseData,
        updatedAt: new Date()
      };

      if (selectedCourse) {
        const courseRef = doc(db, 'courses', selectedCourse.id);
        await updateDoc(courseRef, data);
      } else {
        data.createdAt = new Date();
        data.modules = [];
        await addDoc(collection(db, 'courses'), data);
      }
      
      fetchCourses();
      setCurrentView('list');
    } catch (err) {
      setError(selectedCourse ? 'Failed to update course' : 'Failed to create course');
    }
  };

  const handleSaveModules = async (courseData) => {
    try {
      const courseRef = doc(db, 'courses', courseData.id);
      await updateDoc(courseRef, {
        modules: courseData.modules,
        updatedAt: new Date()
      });
      
      fetchCourses();
      setCurrentView('list');
    } catch (err) {
      setError('Failed to update course modules');
    }
  };

  const handleCancel = () => {
    setCurrentView('list');
    setSelectedCourse(null);
  };

  const openProgramModal = () => {
    setIsProgramModalOpen(true);
  };

  const closeProgramModal = () => {
    setIsProgramModalOpen(false);
  };

  return (
    <div className="course-dashboard-container">
      <div className="dashboard-header">
        <h1>Course Management</h1>
        <button className="btn-primary" onClick={handleAddCourse}>
          Add New Course
        </button>
      </div>

      <div className="navigation-breadcrumb">
        <button 
          className={`breadcrumb-item ${currentView === 'list' ? 'active' : ''}`}
          onClick={() => setCurrentView('list')}
        >
          Course List
        </button>
        {currentView === 'edit-course' && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">Edit Course</span>
          </>
        )}
        {currentView === 'add-course' && (
          <>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">Add Course</span>
          </>
        )}
        {currentView === 'manage-modules' && (
          <>
            <span className="breadcrumb-separator">/</span>
            <button 
              className="breadcrumb-item"
              onClick={() => setCurrentView('list')}
            >
              Course List
            </button>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-item active">Manage Modules</span>
          </>
        )}
      </div>

      <div className="dashboard-content">
        {currentView === 'list' && (
          <CourseList 
            courses={courses}
            loading={loading}
            error={error}
            onEdit={handleEditCourse}
            onDelete={handleDeleteCourse}
            onManageModules={handleManageModules}
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            filters={filters}
            setFilters={setFilters}
            programs={programs}
            onManagePrograms={openProgramModal}
          />
        )}

        {(currentView === 'edit-course' || currentView === 'add-course') && (
          <CourseForm 
            course={selectedCourse}
            onSubmit={handleSaveCourse}
            onCancel={handleCancel}
            programs={programs}
            onManagePrograms={openProgramModal}
          />
        )}

        {currentView === 'manage-modules' && (
          <ModuleManager 
            course={selectedCourse}
            onSave={handleSaveModules}
            onCancel={handleCancel}
          />
        )}
      </div>

      <ProgramManagerModal
        isOpen={isProgramModalOpen}
        onClose={closeProgramModal}
        programs={programs}
        onAddProgram={handleAddProgram}
        onDeleteProgram={handleDeleteProgram}
      />
    </div>
  );
};

export default CourseDashboard;
