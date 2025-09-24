// src/Members/TutorialPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../AnA/firebase';
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { 
  Calendar, 
  Clock, 
  Users, 
  Play, 
  ChevronLeft, 
  ExternalLink,
  Video,
  Mic,
  MessageSquare,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
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
          // Fetch only live tutorials for landing page
          const tutorialsCollection = collection(db, 'liveSessions');
          const q = query(tutorialsCollection, where("status", "==", "live"));
          const tutorialSnapshot = await getDocs(q);
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

  const handleJoinMeeting = (meetLink) => {
    // Open the Google Meet link in a new tab
    window.open(meetLink, '_blank');
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
          <div className="live-indicator">
            <div className="live-dot"></div>
            <span>{tutorials.length} live tutorial{tutorials.length !== 1 ? 's' : ''} available now</span>
          </div>
        </div>

        {tutorials.length === 0 ? (
          <div className="no-tutorials-container">
            <div className="no-tutorials-icon">
              <Video size={48} />
            </div>
            <h2>No Live Tutorials Available</h2>
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
                  <div className="tutorial-status">
                    <div className="live-indicator-card">
                      <div className="live-dot"></div>
                      <span>LIVE NOW</span>
                    </div>
                  </div>
                  <h3>{tutorial.title}</h3>
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
                      <span className="meta-label">Started:</span>
                      <span className="meta-value">
                        {new Date(tutorial.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="tutorial-card-footer">
                  <button 
                    className="btn-join-meeting"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent card click
                      handleJoinMeeting(tutorial.meetLink);
                    }}
                  >
                    <Play size={16} />
                    Join Live Session
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
          <ChevronLeft size={16} />
          Back to All Tutorials
        </button>
      </div>

      <div className="tutorial-header">
        <div className="tutorial-status-header">
          <div className="live-indicator-large">
            <div className="live-dot"></div>
            <span>LIVE NOW</span>
          </div>
          <h1>{tutorial.title}</h1>
        </div>
        <div className="tutorial-meta">
          <div className="meta-item">
            <Calendar size={16} />
            <span>Started: {new Date(tutorial.timestamp?.toDate()).toLocaleString()}</span>
          </div>
          <div className="meta-item">
            <Users size={16} />
            <span>Host: {tutorial.hostName}</span>
          </div>
          <div className="meta-item">
            <Clock size={16} />
            <span>Duration: {tutorial.duration || 'TBD'}</span>
          </div>
        </div>
      </div>

      <div className="meeting-container">
        <div className="meeting-info">
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
              <h3>Prerequisites</h3>
              <p>{tutorial.prerequisites || 'None'}</p>
            </div>
          </div>
          
          <div className="description-section">
            <h2>About This Tutorial</h2>
            <p>{tutorial.description}</p>
            
            {tutorial.topics && tutorial.topics.length > 0 && (
              <div className="topics-section">
                <h3>Topics Covered</h3>
                <ul className="topics-list">
                  {tutorial.topics.map((topic, index) => (
                    <li key={index}>{topic}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        
        <div className="meeting-action">
          <button 
            className="btn-join-meeting-large"
            onClick={() => handleJoinMeeting(tutorial.meetLink)}
          >
            <Play size={20} />
            Join Live Session Now
          </button>
          <div className="meeting-note">
            <AlertCircle size={16} />
            <p>Clicking this button will open the Google Meet session in a new tab</p>
          </div>
        </div>
      </div>

      <div className="chat-section">
        <h2>Live Chat</h2>
        <div className="chat-container">
          <div className="chat-placeholder">
            <MessageSquare size={48} />
            <h3>Live Chat Coming Soon</h3>
            <p>Interactive chat features will be available in future updates</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TutorialPage;
