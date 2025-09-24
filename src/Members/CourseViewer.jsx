// src/components/CourseViewer.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import CourseData from "./Course&UserData/courses.jsx";
import { getFunctions, httpsCallable } from "firebase/functions";
import { 
  BookOpen, 
  Play, 
  FileText, 
  Video, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  CheckCircle,
  BarChart3,
  User
} from "lucide-react";
import "../Styles/courseviewer.css";

const CourseViewer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [activeModule, setActiveModule] = useState(null);
  const [activeContent, setActiveContent] = useState(null);
  const [documentContent, setDocumentContent] = useState(null);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentError, setDocumentError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({
    completedModules: 0,
    totalModules: 0,
    completedContent: 0,
    totalContent: 0
  });

  useEffect(() => {
    const fetchCourseData = async () => {
      try {
        const userId = localStorage.getItem("userId");
        const userEmail = localStorage.getItem("userEmail");

        // call the course data class
        const courseDataService = new CourseData(userId, userEmail);
        const courseData = await courseDataService.getCourseById(courseId);

        if (courseDataService.getError()) {
          setError(courseDataService.getError());
        } else {
          setCourse(courseData);
          
          // Calculate progress
          let completedModules = 0;
          let completedContent = 0;
          let totalContent = 0;
          
          if (courseData.modules) {
            courseData.modules.forEach(module => {
              if (module.content) {
                totalContent += module.content.length;
                module.content.forEach(content => {
                  if (content.completed) {
                    completedContent++;
                  }
                });
                
                // Check if all content in module is completed
                const moduleCompleted = module.content.every(content => content.completed);
                if (moduleCompleted) {
                  completedModules++;
                }
              }
            });
          }
          
          setProgress({
            completedModules,
            totalModules: courseData.modules ? courseData.modules.length : 0,
            completedContent,
            totalContent
          });
          
          // Set the first module as active by default
          if (courseData && courseData.modules && courseData.modules.length > 0) {
            setActiveModule(courseData.modules[0]);
            // Set the first content item as active if it exists
            if (courseData.modules[0].content && courseData.modules[0].content.length > 0) {
              setActiveContent(courseData.modules[0].content[0]);
              if (courseData.modules[0].content[0].type === "document") {
                fetchDocumentContent(courseData.modules[0].content[0]);
              }
            }
          }
        }
      } catch (err) {
        setError("Failed to load course. Please try again.");
        console.error("Error loading course:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourseData();
  }, [courseId]);

  const extractGoogleDocId = (url) => {
    if (!url) return null;
    
    // Extract ID from various Google Drive URL formats
    const regexPatterns = [
      /\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/document\/d\/([a-zA-Z0-9-_]+)/,
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
      /\/presentation\/d\/([a-zA-Z0-9-_]+)/
    ];
    
    for (const regex of regexPatterns) {
      const match = url.match(regex);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };

  const fetchDocumentContent = async (content) => {
    if (!content || !content.url) {
      setDocumentContent("<p>No document URL provided</p>");
      return;
    }
    
    try {
      setDocumentLoading(true);
      setDocumentError(null);
      
      // Extract document ID from Google Drive URL
      const docId = extractGoogleDocId(content.url);
      
      if (!docId) {
        setDocumentError("Unable to extract document ID from URL. Please check the document link.");
        setDocumentLoading(false);
        return;
      }
      
      // Only fetch document content for Google Docs
      // Sheets, Slides and other types will be embedded
      if (getGoogleFileType(content.url) === "Google Doc") {
        try {
          const functions = getFunctions();
          const getGoogleDriveDocument = httpsCallable(functions, 'getGoogleDriveDocument');
          const result = await getGoogleDriveDocument({ id: docId });
          
          if (result.data && result.data.content) {
            setDocumentContent(result.data.content);
          } else {
            throw new Error("No content returned");
          }
        } catch (err) {
          console.error("Firebase function error:", err);
          setDocumentContent(null);
        }
      } else {
        // For Sheets, Slides, etc., we won't fetch content
        setDocumentContent(null);
      }
      
    } catch (err) {
      console.error("Error fetching document content:", err);
      setDocumentError("Failed to load document. Please try again or open it in Google Drive.");
    } finally {
      setDocumentLoading(false);
    }
  };

  const handleModuleClick = (module) => {
    setActiveModule(module);
    if (module.content && module.content.length > 0) {
      const firstContent = module.content[0];
      setActiveContent(firstContent);
      
      if (firstContent.type === "document") {
        fetchDocumentContent(firstContent);
      } else {
        setDocumentContent(null);
      }
    } else {
      setActiveContent(null);
      setDocumentContent(null);
    }
  };

  const handleContentClick = (content) => {
    setActiveContent(content);
    if (content.type === "document") {
      fetchDocumentContent(content);
    } else {
      setDocumentContent(null);
    }
  };

  const handleBackClick = () => {
    navigate(-1); // Navigate back to previous page
  };

  const markContentAsCompleted = async (contentId) => {
    try {
      // Update the content as completed in the course data
      const updatedModules = course.modules.map(module => {
        if (module.content) {
          const updatedContent = module.content.map(content => {
            if (content.id === contentId) {
              return { ...content, completed: true };
            }
            return content;
          });
          return { ...module, content: updatedContent };
        }
        return module;
      });
      
      setCourse({ ...course, modules: updatedModules });
      
      // Update progress
      let completedContent = 0;
      updatedModules.forEach(module => {
        if (module.content) {
          module.content.forEach(content => {
            if (content.completed) {
              completedContent++;
            }
          });
        }
      });
      
      setProgress(prev => ({
        ...prev,
        completedContent
      }));
      
      // Show success notification
      alert("Content marked as completed!");
    } catch (error) {
      console.error("Error marking content as completed:", error);
      alert("Failed to mark content as completed. Please try again.");
    }
  };

  // Function to determine if the URL is for a Google service
  const isGoogleService = (url) => {
    if (!url) return false;
    return url.includes("docs.google.com") || url.includes("slides.google.com") || 
           url.includes("sheets.google.com") || url.includes("drive.google.com");
  };

  // Function to get the file type based on URL
  const getGoogleFileType = (url) => {
    if (!url) return "Document";
    if (url.includes("docs.google.com/document")) return "Google Doc";
    if (url.includes("docs.google.com/spreadsheets") || url.includes("sheets.google.com")) return "Google Sheet";
    if (url.includes("docs.google.com/presentation") || url.includes("slides.google.com")) return "Google Slides";
    if (url.includes("docs.google.com/forms")) return "Google Form";
    if (url.includes("docs.google.com/drawings")) return "Google Drawing";
    return "Google Document";
  };

  // Function to get embedding URL based on file type
  const getEmbedUrl = (url, docId) => {
    if (!url || !docId) return null;
    
    const fileType = getGoogleFileType(url);
    
    switch (fileType) {
      case "Google Doc":
        return `https://docs.google.com/document/d/${docId}/preview`;
      case "Google Sheet":
        return `https://docs.google.com/spreadsheets/d/${docId}/preview`;
      case "Google Slides":
        return `https://docs.google.com/presentation/d/${docId}/embed?start=false&loop=false&delayms=3000`;
      case "Google Form":
        return `https://docs.google.com/forms/d/${docId}/viewform?embedded=true`;
      case "Google Drawing":
        return `https://docs.google.com/drawings/d/${docId}/preview`;
      default:
        return `https://drive.google.com/file/d/${docId}/preview`;
    }
  };

  // Function to render content based on type
  const renderContent = (content) => {
    if (!content) return null;

    // Extract video ID from YouTube URL if it's a YouTube video
    const getYouTubeId = (url) => {
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = url.match(regExp);
      return (match && match[2].length === 11) ? match[2] : null;
    };

    switch (content.type) {
      case "document":
        const docId = extractGoogleDocId(content.url);
        
        // Check if it's a Google service document
        if (isGoogleService(content.url)) {
          const fileType = getGoogleFileType(content.url);
          const embedUrl = getEmbedUrl(content.url, docId);
          
          return (
            <div className="content-viewer document-viewer">
              <div className="content-header">
                <div className="content-title-section">
                  <div className="content-type-icon">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3>{content.title}</h3>
                    <p className="content-type">{fileType}</p>
                  </div>
                </div>
                <div className="content-actions">
                  <a 
                    href={content.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="open-external-btn"
                  >
                    Open in Google Drive
                  </a>
                  {!content.completed && (
                    <button 
                      className="complete-btn"
                      onClick={() => markContentAsCompleted(content.id)}
                    >
                      <CheckCircle size={16} />
                      Mark as Complete
                    </button>
                  )}
                </div>
              </div>
              
              {/* Embedded viewer for all Google document types */}
              <div className="google-doc-embed">
                <iframe 
                  src={embedUrl}
                  title={content.title}
                  width="100%" 
                  height="600" 
                  frameBorder="0" 
                  allowFullScreen
                  className="google-doc-frame"
                ></iframe>
              </div>
              
              {/* Keep the document content for Google Docs for fallback and review functionality */}
              {documentContent && fileType === "Google Doc" && (
                <div className="document-content-hidden" style={{ display: 'none' }}>
                  <div dangerouslySetInnerHTML={{ __html: documentContent }} />
                </div>
              )}
            </div>
          );
        } else {
          // For non-Google Docs, keep the existing document view implementation
          return (
            <div className="content-viewer document-viewer">
              <div className="content-header">
                <div className="content-title-section">
                  <div className="content-type-icon">
                    <FileText size={20} />
                  </div>
                  <div>
                    <h3>{content.title}</h3>
                    <p className="content-type">Document</p>
                  </div>
                </div>
                <div className="content-actions">
                  <a href={content.url} target="_blank" rel="noopener noreferrer" className="open-external-btn">
                    Open Document
                  </a>
                  {!content.completed && (
                    <button 
                      className="complete-btn"
                      onClick={() => markContentAsCompleted(content.id)}
                    >
                      <CheckCircle size={16} />
                      Mark as Complete
                    </button>
                  )}
                </div>
              </div>
              
              {/* Document Content Display */}
              <div className="document-content-area">
                {documentLoading ? (
                  <div className="document-loading">Loading document content...</div>
                ) : documentError ? (
                  <div className="document-error">{documentError}</div>
                ) : documentContent ? (
                  <div 
                    className="document-content" 
                    dangerouslySetInnerHTML={{ __html: documentContent }}
                  />
                ) : (
                  <div className="document-loading">Preparing document...</div>
                )}
              </div>
              
              {/* Direct Google Drive embedding as fallback */}
              {docId && (
                <div className="document-embed-fallback">
                  <h4>Document Preview:</h4>
                  <iframe 
                    src={`https://drive.google.com/file/d/${docId}/preview`} 
                    title={content.title}
                    width="100%" 
                    height="500" 
                    allow="autoplay" 
                    className="document-frame"
                  ></iframe>
                </div>
              )}
            </div>
          );
        }
        
      case "video":
        const videoId = getYouTubeId(content.url);
        if (videoId) {
          return (
            <div className="content-viewer video-viewer">
              <div className="content-header">
                <div className="content-title-section">
                  <div className="content-type-icon">
                    <Video size={20} />
                  </div>
                  <div>
                    <h3>{content.title}</h3>
                    <p className="content-type">Video</p>
                  </div>
                </div>
                <div className="content-actions">
                  <a href={content.url} target="_blank" rel="noopener noreferrer" className="open-external-btn">
                    Watch on YouTube
                  </a>
                  {!content.completed && (
                    <button 
                      className="complete-btn"
                      onClick={() => markContentAsCompleted(content.id)}
                    >
                      <CheckCircle size={16} />
                      Mark as Complete
                    </button>
                  )}
                </div>
              </div>
              
              <div className="video-container">
                <iframe
                  width="100%"
                  height="480"
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={content.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="video-frame"
                ></iframe>
              </div>
              
              <div className="video-description">
                <p>{content.description}</p>
              </div>
            </div>
          );
        } else {
          return (
            <div className="content-viewer video-viewer">
              <div className="content-header">
                <div className="content-title-section">
                  <div className="content-type-icon">
                    <Video size={20} />
                  </div>
                  <div>
                    <h3>{content.title}</h3>
                    <p className="content-type">Video</p>
                  </div>
                </div>
                <div className="content-actions">
                  <a href={content.url} target="_blank" rel="noopener noreferrer" className="open-external-btn">
                    Open Video
                  </a>
                  {!content.completed && (
                    <button 
                      className="complete-btn"
                      onClick={() => markContentAsCompleted(content.id)}
                    >
                      <CheckCircle size={16} />
                      Mark as Complete
                    </button>
                  )}
                </div>
              </div>
              
              <div className="video-description">
                <p>{content.description}</p>
                <a href={content.url} target="_blank" rel="noopener noreferrer" className="video-link">
                  <Play size={16} />
                  Watch Video
                </a>
              </div>
            </div>
          );
        }
      
      default:
        return (
          <div className="content-viewer">
            <div className="content-header">
              <div className="content-title-section">
                <div className="content-type-icon">
                  <FileText size={20} />
                </div>
                <div>
                  <h3>{content.title}</h3>
                  <p className="content-type">Content</p>
                </div>
              </div>
              <div className="content-actions">
                <a href={content.url} target="_blank" rel="noopener noreferrer" className="open-external-btn">
                  Open Content
                </a>
                {!content.completed && (
                  <button 
                    className="complete-btn"
                    onClick={() => markContentAsCompleted(content.id)}
                  >
                    <CheckCircle size={16} />
                    Mark as Complete
                  </button>
                )}
              </div>
            </div>
            
            <div className="content-description">
              <p>{content.description}</p>
            </div>
          </div>
        );
    }
  };

  // Rest of your component remains the same
  if (loading) {
    return (
      <div className="course-viewer-container">
        <div className="loading-spinner">Loading course content...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-viewer-container">
        <div className="error-message">{error}</div>
        <button className="back-button" onClick={handleBackClick}>
          Back to Courses
        </button>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-viewer-container">
        <div className="error-message">Course not found</div>
        <button className="back-button" onClick={handleBackClick}>
          Back to Courses
        </button>
      </div>
    );
  }

  return (
    <div className="course-viewer-container">
      {/* Course Header */}
      <div className="course-viewer-header">
        <button className="back-button" onClick={handleBackClick}>
          <ChevronLeft size={20} />
          Back to Courses
        </button>
        <div className="course-title-section">
          <h1>{course.title}</h1>
          <div className="course-meta">
            {course.targetYears && (
              <span className="course-year">{course.targetYears.join(", ")}</span>
            )}
            {course.targetPrograms && (
              <span className="course-program">{course.targetPrograms.join(", ")}</span>
            )}
          </div>
        </div>
        <div className="course-progress-overview">
          <div className="progress-stats">
            <div className="progress-stat">
              <span className="progress-number">{progress.completedModules}</span>
              <span className="progress-label">Modules</span>
            </div>
            <div className="progress-divider"></div>
            <div className="progress-stat">
              <span className="progress-number">{progress.completedContent}</span>
              <span className="progress-label">Content</span>
            </div>
            <div className="progress-divider"></div>
            <div className="progress-stat">
              <span className="progress-number">
                {progress.totalContent > 0 ? Math.round((progress.completedContent / progress.totalContent) * 100) : 0}%
              </span>
              <span className="progress-label">Complete</span>
            </div>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{width: `${progress.totalContent > 0 ? (progress.completedContent / progress.totalContent) * 100 : 0}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>

      <div className="course-content-layout">
        {/* Modules Sidebar */}
        <div className="modules-sidebar">
          <div className="sidebar-header">
            <h2>Course Content</h2>
            <div className="modules-progress">
              <span>{progress.completedModules} of {progress.totalModules} modules completed</span>
            </div>
          </div>
          
          <ul className="modules-list">
            {course.modules && course.modules.map((module, index) => {
              // Check if all content in module is completed
              const moduleCompleted = module.content && module.content.length > 0 
                ? module.content.every(content => content.completed)
                : false;
                
              // Count completed content in this module
              const completedInModule = module.content 
                ? module.content.filter(content => content.completed).length
                : 0;
                
              return (
                <li 
                  key={module.id || index}
                  className={`module-item ${activeModule && activeModule.id === module.id ? 'active' : ''} ${moduleCompleted ? 'completed' : ''}`}
                  onClick={() => handleModuleClick(module)}
                >
                  <div className="module-header">
                    <div className="module-number">{module.order || index + 1}</div>
                    <div className="module-title">{module.title}</div>
                    {moduleCompleted && (
                      <div className="module-completed">
                        <CheckCircle size={16} />
                      </div>
                    )}
                  </div>
                  
                  {module.content && module.content.length > 0 && (
                    <div className="module-content-preview">
                      <div className="module-content-stats">
                        <span>{completedInModule}/{module.content.length} completed</span>
                      </div>
                      
                      <ul className="content-list">
                        {module.content.slice(0, 3).map((contentItem, contentIndex) => (
                          <li 
                            key={contentItem.id || contentIndex}
                            className={`content-item ${activeContent && activeContent.id === contentItem.id ? 'active' : ''} ${contentItem.completed ? 'completed' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleContentClick(contentItem);
                            }}
                          >
                            <div className="content-icon">
                              {contentItem.type === "document" && <FileText size={14} />}
                              {contentItem.type === "video" && <Video size={14} />}
                              {contentItem.type === "quiz" && <BarChart3 size={14} />}
                            </div>
                            <div className="content-title">{contentItem.title}</div>
                            {contentItem.completed && (
                              <div className="content-completed">
                                <CheckCircle size={14} />
                              </div>
                            )}
                          </li>
                        ))}
                        {module.content.length > 3 && (
                          <li className="content-more">
                            +{module.content.length - 3} more
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>

        {/* Content Display Area */}
        <div className="content-display-area">
          {activeContent ? (
            renderContent(activeContent)
          ) : (
            <div className="no-content-message">
              <div className="no-content-icon">
                <BookOpen size={48} />
              </div>
              <h3>Select a content item to view</h3>
              <p>Choose a module from the sidebar to start learning</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseViewer;
