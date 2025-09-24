// src/components/ai/AIStudy.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '../AnA/firebase';
import { doc, collection, addDoc, serverTimestamp, query, where, getDocs, getDoc, deleteDoc } from 'firebase/firestore';
import Tesseract from 'tesseract.js';
import mammoth from 'mammoth';
import { BookOpen, Brain, FileText, Upload, X, Check, ChevronRight, Search, Download, Eye } from 'lucide-react';
import './styles/AiStudy.css';

const AIStudy = () => {
  const [activeTab, setActiveTab] = useState('quizzes');
  const [documents, setDocuments] = useState([]);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [currentFlashcard, setCurrentFlashcard] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [ocrProgress, setOcrProgress] = useState({ progress: 0, status: '' });
  const [previewUrl, setPreviewUrl] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tab = params.get('tab');
    if (tab === 'flashcards') {
      setActiveTab('flashcards');
    }

    loadUserDocuments();
    loadUserQuizzes();
    loadUserFlashcards();
  }, []);

  const loadUserDocuments = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const documentsCollectionRef = collection(userDocRef, 'documents');
      const q = query(documentsCollectionRef);
      const querySnapshot = await getDocs(q);
      
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      setError('Failed to load documents. Please try again.');
    }
  };

  const loadUserQuizzes = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const quizzesCollectionRef = collection(userDocRef, 'quizzes');
      const q = query(quizzesCollectionRef);
      const querySnapshot = await getDocs(q);
      
      const userQuizzes = [];
      querySnapshot.forEach((doc) => {
        userQuizzes.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setQuizzes(userQuizzes);
    } catch (error) {
      console.error('Error loading quizzes:', error);
      setError('Failed to load quizzes. Please try again.');
    }
  };

  const loadUserFlashcards = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const flashcardsCollectionRef = collection(userDocRef, 'flashcards');
      const q = query(flashcardsCollectionRef);
      const querySnapshot = await getDocs(q);
      
      const userFlashcards = [];
      querySnapshot.forEach((doc) => {
        userFlashcards.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      setFlashcards(userFlashcards);
    } catch (error) {
      console.error('Error loading flashcards:', error);
      setError('Failed to load flashcards. Please try again.');
    }
  };

  // Extract text from Word document
  const extractTextFromWord = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return result.value;
    } catch (error) {
      console.error('Error extracting text from Word document:', error);
      throw error;
    }
  };

  // Extract images from Word document for OCR
  const extractImagesFromWord = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractImages({ arrayBuffer });
      
      // Convert base64 images to blobs
      const images = [];
      for (const image of result.images) {
        const byteCharacters = atob(image.image.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: image.contentType });
        images.push(blob);
      }
      
      return images;
    } catch (error) {
      console.error('Error extracting images from Word document:', error);
      throw error;
    }
  };

  // Perform OCR on an image
  const performOCR = async (image) => {
    try {
      return await Tesseract.recognize(
        image,
        'eng',
        {
          logger: (progress) => {
            if (progress.status === 'recognizing text') {
              const progressValue = Math.min(100, Math.round(progress.progress * 100));
              setOcrProgress({
                progress: progressValue,
                status: `Processing: ${progressValue}%`
              });
            }
          }
        }
      ).then(result => result.data.text);
    } catch (error) {
      console.error('Error performing OCR:', error);
      throw error;
    }
  };

  // Process document - extract text or use OCR if needed
  const processDocument = async (file) => {
    try {
      setOcrProgress({ progress: 0, status: 'Processing document...' });
      setError(null);
      
      let text = '';
      
      // Try to extract text directly from Word document
      text = await extractTextFromWord(file);
      
      // If extracted text is too short, try OCR on embedded images
      if (text.trim().length < 50) {
        setOcrProgress({ progress: 10, status: 'Extracting images for OCR...' });
        const images = await extractImagesFromWord(file);
        
        setOcrProgress({ progress: 20, status: 'Performing OCR on images...' });
        const ocrTexts = [];
        
        for (let i = 0; i < images.length; i++) {
          const ocrText = await performOCR(images[i]);
          ocrTexts.push(ocrText);
        }
        
        text = ocrTexts.join('\n');
      }
      
      setOcrProgress({ progress: 100, status: 'Processing completed!' });
      
      // Reset progress after a delay
      setTimeout(() => {
        setOcrProgress({ progress: 0, status: '' });
      }, 2000);
      
      return text;
    } catch (error) {
      console.error('Error processing document:', error);
      setOcrProgress({ progress: 0, status: 'Processing failed' });
      
      // Provide specific error messages
      if (error.message.includes('network')) {
        setError('Network error: Failed to process document. Please check your internet connection.');
      } else if (error.message.includes('timeout')) {
        setError('Processing timed out. Please try again with a smaller file.');
      } else if (error.message.includes('format')) {
        setError('Unsupported file format. Please use Word documents (.doc, .docx).');
      } else {
        setError(`Failed to process document: ${error.message || 'Unknown error'}`);
      }
      
      throw new Error('Document processing failed');
    }
  };

  const callGeminiAPI = async (prompt) => {
    // Check if API key is available
    if (!GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured. Please check your environment variables.');
    }

    try {
      // Updated to use the correct model and endpoint
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('No response from Gemini API');
      }
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      setError(`Failed to generate content: ${error.message}`);
      throw error;
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    // Reset error state
    setError(null);
    
    // File validation
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    // Validate file size
    if (uploadedFile.size > MAX_FILE_SIZE) {
      setError('File size must be less than 10MB');
      return;
    }
    
    // Validate file type
    if (!allowedTypes.includes(uploadedFile.type)) {
      setError('Please upload a Word document (.doc, .docx)');
      return;
    }

    setIsProcessing(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Process the document (extract text or use OCR)
      const extractedText = await processDocument(uploadedFile);
      
      if (!extractedText || extractedText.trim().length === 0) {
        throw new Error('No text could be extracted from the document');
      }
      
      setUploadProgress(95);

      // Save document to Firestore
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const documentsCollectionRef = collection(userDocRef, 'documents');
        
        const docRef = await addDoc(documentsCollectionRef, {
          fileName: uploadedFile.name,
          extractedText: extractedText,
          uploadedAt: serverTimestamp(),
          type: uploadedFile.type,
          fileSize: uploadedFile.size
        });

        setUploadProgress(100);
        clearInterval(progressInterval);

        // Add to documents list
        const newDocument = {
          id: docRef.id,
          fileName: uploadedFile.name,
          extractedText: extractedText,
          uploadedAt: new Date(),
          type: uploadedFile.type,
          fileSize: uploadedFile.size
        };
        
        setDocuments(prev => [...prev, newDocument]);

        // Auto-select the uploaded document
        setSelectedDocument(newDocument);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      // Error is already set in processDocument
    } finally {
      setIsProcessing(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const generateQuizzes = async () => {
    if (!selectedDocument) {
      setError('Please select a document first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const prompt = `Based on the following document, generate 5 multiple-choice questions with 4 options each. Format the response as a JSON array with the following structure:
      [
        {
          "question": "Question text",
          "options": ["Option A", "Option B", "Option C", "Option D"],
          "correctAnswer": 0 // Index of the correct option (0-3)
        }
      ]
      
      Document: ${selectedDocument.extractedText}`;

      const response = await callGeminiAPI(prompt);
      
      // Parse the JSON response
      let quizQuestions;
      try {
        // Clean the response to handle potential markdown formatting
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        quizQuestions = JSON.parse(cleanResponse);
      } catch (error) {
        console.error('Error parsing quiz response:', error);
        throw new Error('Failed to generate valid quiz questions.');
      }

      // Validate the parsed data
      if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) {
        throw new Error('Invalid quiz format generated.');
      }

      // Save to Firestore
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const quizzesCollectionRef = collection(userDocRef, 'quizzes');
        
        const quizRef = await addDoc(quizzesCollectionRef, {
          title: `Quiz based on ${selectedDocument.fileName}`,
          questions: quizQuestions,
          documentId: selectedDocument.id,
          createdAt: serverTimestamp()
        });

        // Add to quizzes list
        setQuizzes(prev => [...prev, {
          id: quizRef.id,
          title: `Quiz based on ${selectedDocument.fileName}`,
          questions: quizQuestions,
          documentId: selectedDocument.id,
          createdAt: new Date()
        }]);

        alert('Quiz generated successfully!');
      }
    } catch (error) {
      console.error('Error generating quiz:', error);
      setError(`Failed to generate quiz: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateFlashcards = async () => {
    if (!selectedDocument) {
      setError('Please select a document first.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const prompt = `Based on the following document, generate 10 flashcards with a question on the front and the answer on the back. Format the response as a JSON array with the following structure:
      [
        {
          "front": "Question or concept",
          "back": "Answer or explanation"
        }
      ]
      
      Document: ${selectedDocument.extractedText}`;

      const response = await callGeminiAPI(prompt);
      
      // Parse the JSON response
      let flashcardData;
      try {
        // Clean the response to handle potential markdown formatting
        const cleanResponse = response.replace(/```json\n?/g, '').replace(/```/g, '').trim();
        flashcardData = JSON.parse(cleanResponse);
      } catch (error) {
        console.error('Error parsing flashcard response:', error);
        throw new Error('Failed to generate valid flashcards.');
      }

      // Validate the parsed data
      if (!Array.isArray(flashcardData) || flashcardData.length === 0) {
        throw new Error('Invalid flashcard format generated.');
      }

      // Save to Firestore
      const user = auth.currentUser;
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const flashcardsCollectionRef = collection(userDocRef, 'flashcards');
        
        const flashcardRef = await addDoc(flashcardsCollectionRef, {
          title: `Flashcards based on ${selectedDocument.fileName}`,
          cards: flashcardData,
          documentId: selectedDocument.id,
          createdAt: serverTimestamp()
        });

        // Add to flashcards list
        setFlashcards(prev => [...prev, {
          id: flashcardRef.id,
          title: `Flashcards based on ${selectedDocument.fileName}`,
          cards: flashcardData,
          documentId: selectedDocument.id,
          createdAt: new Date()
        }]);

        alert('Flashcards generated successfully!');
      }
    } catch (error) {
      console.error('Error generating flashcards:', error);
      setError(`Failed to generate flashcards: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

const nextFlashcard = () => {
  const currentFlashcardSet = flashcards.find(f => f.documentId === selectedDocument.id);
  if (currentFlashcardSet && currentFlashcard < currentFlashcardSet.cards.length - 1) {
    setCurrentFlashcard(currentFlashcard + 1);
    setShowAnswer(false);
  }
};

const prevFlashcard = () => {
  if (currentFlashcard > 0) {
    setCurrentFlashcard(currentFlashcard - 1);
    setShowAnswer(false);
  }
};

  const takeQuiz = (quizId) => {
    navigate(`/quiz/${quizId}`);
  };

  const handlePreview = (document) => {
    // For Word documents, we don't have a preview yet
    setPreviewUrl(null);
  };

  const filteredDocuments = documents.filter(doc => 
    doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.extractedText.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteDocument = async (documentId) => {
    if (window.confirm('Are you sure you want to delete this document?')) {
      try {
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const documentRef = doc(userDocRef, 'documents', documentId);
          await deleteDoc(documentRef);
          
          // Update the documents list
          setDocuments(prev => prev.filter(doc => doc.id !== documentId));
          
          // Clear selection if the deleted document was selected
          if (selectedDocument?.id === documentId) {
            setSelectedDocument(null);
            setPreviewUrl(null);
          }
          
          alert('Document deleted successfully');
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        setError('Error deleting document. Please try again.');
      }
    }
  };

  const downloadJSON = (data, filename) => {
    try {
      const jsonStr = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 0);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again.');
    }
  };

  return (
    <div className="ai-study-container">
      <div className="ai-study-header">
        <h1>AI Study Tools</h1>
        <p>Upload Word documents and generate personalized quizzes and flashcards</p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-container">
          <div className="error-message">
            {error}
            <button onClick={() => setError(null)} className="error-close">
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* OCR Progress Indicator */}
      {ocrProgress.status && (
        <div className="ocr-progress-container">
          <div className="ocr-progress-bar">
            <div 
              className="ocr-progress-fill" 
              style={{ width: `${ocrProgress.progress}%` }}
            ></div>
          </div>
          <span className="ocr-progress-text">{ocrProgress.status}</span>
        </div>
      )}

      <div className="ai-study-tabs">
        <button 
          className={`tab-button ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
        >
          <BookOpen size={20} />
          <span>Quizzes</span>
        </button>
        <button 
          className={`tab-button ${activeTab === 'flashcards' ? 'active' : ''}`}
          onClick={() => setActiveTab('flashcards')}
        >
          <Brain size={20} />
          <span>Flashcards</span>
        </button>
      </div>

      <div className="ai-study-content">
        <div className="document-section">
          <h2>Your Documents</h2>
          
          <div className="document-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="document-upload">
            <label htmlFor="document-upload" className="upload-label">
              <Upload size={18} />
              <span>Upload Word Document</span>
            </label>
            <input 
              id="document-upload"
              type="file" 
              accept=".doc,.docx" 
              onChange={handleFileUpload}
              style={{ display: 'none' }}
            />
          </div>

          {isProcessing && (
            <div className="progress-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${uploadProgress}%` }}></div>
              </div>
              <span className="progress-text">{uploadProgress}%</span>
            </div>
          )}

          <div className="documents-list">
            {filteredDocuments.length === 0 ? (
              <p>No documents uploaded yet. Upload a Word document to get started.</p>
            ) : (
              filteredDocuments.map(doc => (
                <div 
                  key={doc.id} 
                  className={`document-item ${selectedDocument?.id === doc.id ? 'selected' : ''}`}
                  onClick={() => setSelectedDocument(doc)}
                >
                  <div className="document-info">
                    <FileText size={18} />
                    <div className="document-details">
                      <span className="document-name">{doc.fileName}</span>
                      <span className="document-size">
                        {(doc.fileSize / 1024 / 1024).toFixed(2)} MB
                      </span>
                    </div>
                  </div>
                  {selectedDocument?.id === doc.id && <Check size={18} />}
                  
                  <div className="document-actions">
                    <button 
                      className="delete-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteDocument(doc.id);
                      }}
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="tools-section">
          {activeTab === 'quizzes' && (
            <>
              <h2>Quiz Generator</h2>
              <div className="tool-description">
                <p>Select a document and generate a multiple-choice quiz based on its content.</p>
              </div>
              <button 
                className="generate-button" 
                onClick={generateQuizzes}
                disabled={!selectedDocument || isProcessing}
              >
                {isProcessing ? 'Generating...' : 'Generate Quiz'}
              </button>

              <h3>Your Quizzes</h3>
              <div className="quizzes-list">
                {quizzes.length === 0 ? (
                  <p>No quizzes generated yet. Upload a document and generate a quiz.</p>
                ) : (
                  quizzes.map(quiz => (
                    <div key={quiz.id} className="quiz-item" onClick={() => takeQuiz(quiz.id)}>
                      <div className="quiz-info">
                        <h4>{quiz.title}</h4>
                        <p>{quiz.questions?.length || 0} questions</p>
                      </div>
                      <div className="quiz-actions">
                        <button 
                          className="download-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadJSON(quiz.questions, `${quiz.title}.json`);
                          }}
                        >
                          <Download size={16} />
                        </button>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {activeTab === 'flashcards' && (
            <>
              <h2>Flashcard Generator</h2>
              <div className="tool-description">
                <p>Select a document and generate flashcards based on its content.</p>
              </div>
              <button 
                className="generate-button" 
                onClick={generateFlashcards}
                disabled={!selectedDocument || isProcessing}
              >
                {isProcessing ? 'Generating...' : 'Generate Flashcards'}
              </button>

              <h3>Your Flashcards</h3>
              <div className="flashcards-list">
                {flashcards.length === 0 ? (
                  <p>No flashcards generated yet. Upload a document and generate flashcards.</p>
                ) : (
                  flashcards.map((flashcardSet, index) => (
                    <div key={flashcardSet.id} className="flashcard-set" onClick={() => {
                      setSelectedDocument(documents.find(d => d.id === flashcardSet.documentId));
                      setCurrentFlashcard(0);
                      setShowAnswer(false);
                    }}>
                      <div className="flashcard-info">
                        <h4>{flashcardSet.title}</h4>
                        <p>{flashcardSet.cards?.length || 0} cards</p>
                      </div>
                      <div className="flashcard-actions">
                        <button 
                          className="download-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            downloadJSON(flashcardSet.cards, `${flashcardSet.title}.json`);
                          }}
                        >
                          <Download size={16} />
                        </button>
                        <ChevronRight size={18} />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {selectedDocument && flashcards.find(f => f.documentId === selectedDocument.id) && (
                <div className="flashcard-viewer">
                  <div className="flashcard-container">
                    <div className={`flashcard ${showAnswer ? 'flipped' : ''}`}>
                      <div className="flashcard-front">
                        <h4>Question</h4>
                        <p>{
                          flashcards
                            .find(f => f.documentId === selectedDocument.id)
                            ?.cards[currentFlashcard]?.front || 'No question available'
                        }</p>
                      </div>
                      <div className="flashcard-back">
                        <h4>Answer</h4>
                        <p>{
                          flashcards
                            .find(f => f.documentId === selectedDocument.id)
                            ?.cards[currentFlashcard]?.back || 'No answer available'
                        }</p>
                      </div>
                    </div>
                  </div>
                  <div className="flashcard-controls">
                    <button onClick={prevFlashcard} disabled={currentFlashcard === 0}>
                      Previous
                    </button>
                    <button onClick={() => setShowAnswer(!showAnswer)}>
                      {showAnswer ? 'Show Question' : 'Show Answer'}
                    </button>
                    <button onClick={nextFlashcard} disabled={currentFlashcard === flashcards.find(f => f.documentId === selectedDocument.id)?.cards?.length - 1}>
                      Next
                    </button>
                  </div>
                  <div className="flashcard-progress">
                    {currentFlashcard + 1} / {flashcards.find(f => f.documentId === selectedDocument.id)?.cards?.length || 0}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIStudy;
