import React, { useEffect, useState, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

const TutorRoute = ({ children }) => {
  const auth = getAuth();
  const db = getFirestore();
  const user = auth.currentUser;
  const [isTutor, setIsTutor] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if user is a tutor - using useCallback to prevent dependency issues
  const checkTutorStatus = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return false;
    }
    
    try {
      const tutorDoc = await getDoc(doc(db, 'tutors', user.uid));
      return tutorDoc.exists();
    } catch (error) {
      console.error('Error checking tutor status:', error);
      return false;
    }
  }, [user, db]);

  useEffect(() => {
    const verifyTutor = async () => {
      setLoading(true);
      const tutorStatus = await checkTutorStatus();
      setIsTutor(tutorStatus);
      setLoading(false);
    };

    verifyTutor();
  }, [checkTutorStatus]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return isTutor ? children : <Navigate to="/dashboard" />;
};

export default TutorRoute;
