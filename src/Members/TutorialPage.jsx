// src/components/student/TutorialPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../AnA/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import '../Styles/TutorialPage.css';

const TutorialPage = () => {
  const { tutorialId } = useParams();
  const navigate = useNavigate();
  const [tutorial, setTutorial] = useState(null);
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        if (tutorialId) {
          // Fetch specific tutorial
          const tutorialRef = doc(db, 'liveSessions', tutorialId);
          const tutorialDoc = await getDoc(tutorialRef);
          
          if (tutorialDoc.exists()) {
            setTutorial({
              id: tutorialDoc.id,
              ...tutorialDoc.data()
            });
          } else {
            setError('Tutorial not found');
          }
        } else {
          // Fetch all tutorials for landing page
          const tutorialsCollection = collection(db, 'liveSessions');
          const tutorialSnapshot = await getDocs(tutorialsCollection);
          const tutorialList = tutorialSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setTutorials(tutorialList);
        }
        
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch tutorials');
        setLoading(false);
      }
    };

    fetchData();
  }, [tutorialId]);

  const handleTutorialClick = (id) => {
    navigate(`/tutorial/${id}`);
  };

  const handleBackToTutorials = () => {
    navigate('/tutorial');
  };

  if (loading) return <div className="loading-spinner">Loading tutorials...</div>;
  if (error) return <div className="error-message">{error}</div>;

  // Show landing page if no specific tutorial is requested
  if (!tutorialId) {
    return (
      <div className="tutorials-landing-container">
        <div className="tutorials-landing-header">
          <h1>Live Tutorials</h1>
          <p>Join live sessions with expert tutors and enhance your learning experience</p>
        </div>

        {tutorials.length === 0 ? (
          <div className="no-tutorials-container">
            <div className="no-tutorials-icon">📺</div>
            <h2>No Tutorials Available</h2>
            <p>There are currently no live tutorials scheduled. Check back later for updates.</p>
          </div>
        ) : (
          <div className="tutorials-grid">
            {tutorials.map(tutorial => (
              <div 
                key={tutorial.id} 
                className="tutorial-card"
                onClick={() => handleTutorialClick(tutorial.id)}
              >
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
                  </div>
                </div>
                <div className="tutorial-card-footer">
                  <button className="btn-view-tutorial">
                    {tutorial.status === 'live' ? 'Join Now' : 'View Details'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Show specific tutorial page
  if (!tutorial) return <div className="error-message">Tutorial not found</div>;

  return (
    <div className="tutorial-page-container">
      <div className="tutorial-navigation">
        <button className="btn-back" onClick={handleBackToTutorials}>
          ← Back to All Tutorials
        </button>
      </div>

      <div className="tutorial-header">
        <h1>{tutorial.title}</h1>
        <div className="tutorial-meta">
          <span className="tutorial-host">Host: {tutorial.hostName}</span>
          <span className="tutorial-date">
            {new Date(tutorial.scheduledDate).toLocaleString()}
          </span>
          <span className={`tutorial-status ${tutorial.status}`}>
            {tutorial.status === 'live' ? 'LIVE NOW' : tutorial.status.toUpperCase()}
          </span>
        </div>
      </div>

      <div className="video-container">
        <div className="video-wrapper">
          <iframe
            className="video-iframe"
            src={`https://www.youtube.com/embed/${tutorial.videoId}?autoplay=1`}
            title={tutorial.title}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          ></iframe>
        </div>
      </div>

      <div className="tutorial-details">
        <div className="description-section">
          <h2>About This Tutorial</h2>
          <p>{tutorial.description}</p>
        </div>

        <div className="info-section">
          <div className="info-card">
            <h3>Course</h3>
            <p>{tutorial.courseName}</p>
          </div>
          <div className="info-card">
            <h3>Target Audience</h3>
            <p>{tutorial.targetAudience}</p>
          </div>
          <div className="info-card">
            <h3>Duration</h3>
            <p>{tutorial.duration || 'TBD'}</p>
          </div>
        </div>
      </div>

      <div className="chat-section">
        <h2>Live Chat</h2>
        <div className="chat-container">
          <p>Live chat will appear here. This feature is coming soon!</p>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
