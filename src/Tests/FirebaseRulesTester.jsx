import React, { useState, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getFirestore, connectFirestoreEmulator, doc, getDoc, addDoc, updateDoc, deleteDoc, collection } from "firebase/firestore";
import './FirebaseRulesTester.css';
import { firebaseConfig } from '../Config/firebaseConfig';

const FirebaseRulesTester = () => {
  const [testResults, setTestResults] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [testUserType, setTestUserType] = useState('unauthenticated');
  const [app, setApp] = useState(null);
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  
  // User credentials state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Initialize Firebase
  useEffect(() => {
    const firebaseApp = initializeApp(firebaseConfig);
    const firebaseAuth = getAuth(firebaseApp);
    const firestoreDb = getFirestore(firebaseApp);
    
    setApp(firebaseApp);
    setAuth(firebaseAuth);
    setDb(firestoreDb);
    
    // Set up emulator connection for testing
    if (window.location.hostname === "localhost") {
      connectFirestoreEmulator(firestoreDb, "localhost", 8080);
    }
    
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      setCurrentUser(user);
      if (user) {
        setTestUserType('authenticated');
      } else {
        setTestUserType('unauthenticated');
      }
    });
    
    return () => unsubscribe();
  }, []);

  // Authenticate with provided credentials
  const authenticateUser = async () => {
    if (!auth) return;
    
    setLoading(true);
    setAuthError('');
    
    try {
      await signOut(auth);
      
      if (!email || !password) {
        setTestUserType('unauthenticated');
        setLoading(false);
        return;
      }
      
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      setAuthError(error.message);
      setTestUserType('unauthenticated');
    } finally {
      setLoading(false);
    }
  };

  // Sign out
  const signOutUser = async () => {
    if (!auth) return;
    
    setLoading(true);
    try {
      await signOut(auth);
      setEmail('');
      setPassword('');
      setAuthError('');
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Add a test result to the state
  const addTestResult = (collection, operation, success, message = '') => {
    setTestResults(prev => [
      ...prev,
      {
        id: Date.now(),
        collection,
        operation,
        success,
        message,
        userType: testUserType,
        userEmail: currentUser?.email || 'Unauthenticated'
      }
    ]);
  };

  // Test read operation
  const testRead = async (collectionName, docId) => {
    if (!db) return;
    
    try {
      const docRef = doc(db, collectionName, docId);
      const docSnap = await getDoc(docRef);
      addTestResult(collectionName, `Read ${docId}`, docSnap.exists(), docSnap.exists() ? 'Success' : 'Document not found');
    } catch (error) {
      addTestResult(collectionName, `Read ${docId}`, false, error.message);
    }
  };

  // Test create operation
  const testCreate = async (collectionName, data) => {
    if (!db) return;
    
    try {
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, data);
      addTestResult(collectionName, 'Create', true, `Created with ID: ${docRef.id}`);
      
      // Clean up created document
      await deleteDoc(docRef);
    } catch (error) {
      addTestResult(collectionName, 'Create', false, error.message);
    }
  };

  // Test update operation
  const testUpdate = async (collectionName, docId, data) => {
    if (!db) return;
    
    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, data);
      addTestResult(collectionName, `Update ${docId}`, true, 'Update successful');
    } catch (error) {
      addTestResult(collectionName, `Update ${docId}`, false, error.message);
    }
  };

  // Test delete operation
  const testDelete = async (collectionName, docId) => {
    if (!db) return;
    
    try {
      // First create a document to delete
      const collectionRef = collection(db, collectionName);
      const docRef = await addDoc(collectionRef, { test: true });
      
      // Then delete it
      await deleteDoc(docRef);
      addTestResult(collectionName, 'Delete', true, 'Delete successful');
    } catch (error) {
      addTestResult(collectionName, 'Delete', false, error.message);
    }
  };

  // Run all tests for the current user type
  const runAllTests = async () => {
    if (!db) return;
    
    setLoading(true);
    setTestResults([]);
    
    // Test data
    const contentData = {
      contentType: 'article',
      title: 'Test Article',
      metadata: {
        author: {
          uid: currentUser ? currentUser.uid : 'unknown'
        }
      }
    };
    
    const courseData = {
      title: 'Test Course',
      description: 'Test Description'
    };
    
    const liveSessionData = {
      title: 'Test Session',
      description: 'Test Description',
      link: 'https://meet.google.com/abc-defg-hij',
      timestamp: Date.now(),
      status: 'scheduled',
      createdBy: currentUser ? currentUser.uid : 'unknown',
      active: true
    };
    
    // Run tests based on user type
    if (testUserType === 'authenticated') {
      // Authenticated user tests
      await testRead('users', currentUser?.uid);
      await testCreate('Queries', { text: 'Test query' });
      await testRead('content', 'test-content');
      await testRead('courses', 'test-course');
      await testRead('Assessments', 'test-assessment');
      await testRead('notifications', 'test-notification');
      await testRead('liveSessions', 'test-session');
      
      // Test admin-specific operations if user is an admin
      try {
        const adminDoc = await getDoc(doc(db, 'admins', currentUser.uid));
        if (adminDoc.exists()) {
          // Admin tests
          await testCreate('content', contentData);
          await testUpdate('content', 'test-content', { title: 'Updated Title' });
          await testDelete('content', 'test-content');
          await testCreate('courses', courseData);
          await testCreate('notifications', { message: 'Test notification' });
          await testCreate('liveSessions', liveSessionData);
        }
      } catch (error) {
        addTestResult('Admin Check', 'Check admin status', false, error.message);
      }
    } else {
      // Unauthenticated tests
      await testRead('users', 'test-user');
      await testRead('content', 'test-content');
      await testRead('courses', 'test-course');
      await testRead('Assessments', 'test-assessment');
      await testRead('notifications', 'test-notification');
      await testRead('liveSessions', 'test-session');
    }
    
    setLoading(false);
  };

  // Clear test results
  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="firebase-rules-tester">
      <h1>Firebase Security Rules Tester</h1>
      
      <div className="user-selection">
        <h2>Test User</h2>
        
        <div className="auth-form">
          <div className="input-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email"
              disabled={loading}
            />
          </div>
          
          <div className="input-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              disabled={loading}
            />
          </div>
          
          <div className="auth-buttons">
            <button 
              className="auth-button"
              onClick={authenticateUser}
              disabled={loading || !email || !password}
            >
              {loading ? 'Authenticating...' : 'Test User'}
            </button>
            
            <button 
              className="auth-button signout"
              onClick={signOutUser}
              disabled={loading || !currentUser}
            >
              Sign Out
            </button>
          </div>
          
          {authError && <div className="auth-error">{authError}</div>}
        </div>
        
        <div className="current-user">
          <p>Current User: {currentUser ? currentUser.email : 'Unauthenticated'}</p>
          <p>User Type: {testUserType}</p>
          {currentUser && <p>User ID: {currentUser.uid}</p>}
        </div>
      </div>
      
      <div className="test-controls">
        <button className="run-tests-button" onClick={runAllTests} disabled={loading || !db}>
          {loading ? 'Running Tests...' : 'Run All Tests'}
        </button>
        <button className="clear-results-button" onClick={clearResults}>
          Clear Results
        </button>
      </div>
      
      <div className="results-section">
        <h2>Test Results</h2>
        {testResults.length === 0 ? (
          <p>No test results yet. Run tests to see results.</p>
        ) : (
          <div className="results-table">
            <div className="table-header">
              <div>Collection</div>
              <div>Operation</div>
              <div>User</div>
              <div>Status</div>
              <div>Message</div>
            </div>
            {testResults.map(result => (
              <div key={result.id} className={`table-row ${result.success ? 'success' : 'failure'}`}>
                <div>{result.collection}</div>
                <div>{result.operation}</div>
                <div>{result.userEmail}</div>
                <div>{result.success ? '✓ Success' : '✗ Failed'}</div>
                <div>{result.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="rules-summary">
        <h2>Rules Summary</h2>
        <ul>
          <li><strong>Users:</strong> Users can read/write their own data. Admins can read all users.</li>
          <li><strong>Admins:</strong> Authenticated users can read. Only admins can create/delete.</li>
          <li><strong>Content:</strong> Authenticated users can read. Only admins can create/update/delete with validation.</li>
          <li><strong>Courses:</strong> Authenticated users can read. Only admins can create/update/delete.</li>
          <li><strong>Assessments:</strong> Authenticated users can read. Only admins can create/update/delete.</li>
          <li><strong>Queries:</strong> Authenticated users can read. Members and admins can create/update/delete.</li>
          <li><strong>Notifications:</strong> Authenticated users can read. Only admins can create/update/delete.</li>
          <li><strong>Live Sessions:</strong> Authenticated users can read. Only admins can create/update/delete with validation.</li>
        </ul>
      </div>
    </div>
  );
};

export default FirebaseRulesTester;
