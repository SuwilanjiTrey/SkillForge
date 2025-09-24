// src/components/math/MathChatbot.jsx
import React, { useState, useRef } from 'react';
import { MessageSquare, X, Send, Upload, Bot, User, BookOpen, Brain } from 'lucide-react';
import { createWorker } from 'tesseract.js';
import { db, auth } from '../AnA/firebase';
import { doc, setDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import './styles/MathChatbot.css';

const MathChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      id: 1, 
      text: "Hello! I'm your Math Assistant. Upload a document (PDF, Word, or image) and I'll help solve the math problems.", 
      sender: 'ai',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [file, setFile] = useState(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrProgress, setOcrProgress] = useState({ progress: 0, status: '' });
  const [documentContext, setDocumentContext] = useState('');
  const [activeTab, setActiveTab] = useState('chat'); // 'chat' or 'study'
  const messagesEndRef = useRef(null);

  const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY;

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  // Helper function to format rich text
  const formatRichText = (text) => {
    // Process bold text: **text** -> <strong>text</strong>
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Process italic text: *text* -> <em>text</em>
    text = text.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
    // Process underline text: __text__ -> <u>text</u>
    text = text.replace(/__(.*?)__/g, '<u>$1</u>');
    
    return text;
  };

  // Component to safely render formatted text
  const RichText = ({ text }) => {
    const formattedText = formatRichText(text);
    
    return (
      <span 
        dangerouslySetInnerHTML={{ __html: formattedText }}
      />
    );
  };

  const performOCR = async (file) => {
    try {
      // Reset OCR progress
      setOcrProgress({ progress: 0, status: 'Initializing OCR...' });
      
      // Create worker with the correct initialization
      const worker = await createWorker({
        logger: m => {
          // Update progress based on log messages
          if (m.jobId === 'Job' && m.status === 'recognizing text') {
            const progress = Math.min(100, Math.round(m.progress * 100));
            setOcrProgress({
              progress,
              status: `Processing: ${progress}%`
            });
          }
        },
      });
      
      setOcrProgress({ progress: 10, status: 'Loading language data...' });
      
      // Load the language data
      await worker.load();
      await worker.loadLanguage('eng');
      
      setOcrProgress({ progress: 30, status: 'Initializing recognition...' });
      
      // Recognize the text
      const { data: { text } } = await worker.recognize(file);
      
      setOcrProgress({ progress: 100, status: 'OCR completed successfully!' });
      
      // Terminate the worker
      await worker.terminate();
      
      // Reset progress after a delay
      setTimeout(() => {
        setOcrProgress({ progress: 0, status: '' });
      }, 2000);
      
      return text;
    } catch (error) {
      console.error('Error performing OCR:', error);
      setOcrProgress({ progress: 0, status: 'OCR failed' });
      throw new Error('OCR processing failed');
    }
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      // File validation
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
        'image/jpg'
      ];
      
      if (uploadedFile.size > MAX_FILE_SIZE) {
        alert('File size must be less than 10MB');
        return;
      }
      
      if (!allowedTypes.includes(uploadedFile.type)) {
        alert('Please upload a PDF, Word document, or image file');
        return;
      }

      setFile(uploadedFile);
      setIsProcessing(true);
      
      // Add user message about file upload
      const newUserMessage = {
        id: messages.length + 1,
        text: `I've uploaded a document: ${uploadedFile.name}`,
        sender: 'user',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, newUserMessage]);
      
      try {
        // Perform OCR
        const extractedText = await performOCR(uploadedFile);
        setOcrText(extractedText);
        setDocumentContext(extractedText);
        
        // Save document to Firestore
        const user = auth.currentUser;
        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const documentsCollectionRef = collection(userDocRef, 'documents');
          
          await addDoc(documentsCollectionRef, {
            fileName: uploadedFile.name,
            extractedText: extractedText,
            uploadedAt: serverTimestamp(),
            type: uploadedFile.type,
            fileSize: uploadedFile.size
          });
        }
        
        // Add AI response about OCR completion
        const ocrMessage = {
          id: messages.length + 2,
          text: "I've processed your document and extracted the text. I can now help you with any math problems from it. What would you like to know?",
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, ocrMessage]);
      } catch (error) {
        console.error('Error processing document:', error);
        
        const errorMessage = {
          id: messages.length + 2,
          text: "I'm sorry, I encountered an error while processing your document. Please try again.",
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } finally {
        setIsProcessing(false);
        scrollToBottom();
      }
    }
  };

  const callGeminiAPI = async (prompt) => {
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
      return "I'm sorry, I encountered an error while processing your request. Please try again later.";
    }
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    
    // Add user message
    const newUserMessage = {
      id: messages.length + 1,
      text: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setInputValue('');
    
    // Simulate AI processing
    setIsProcessing(true);
    
    try {
      // Create prompt for Gemini
      let prompt = inputValue;
      if (documentContext) {
        prompt = `Based on the following document context:\n\n${documentContext}\n\nQuestion: ${inputValue}\n\nPlease provide a step-by-step solution to this math problem.`;
      }
      
      // Call Gemini API
      const aiResponseText = await callGeminiAPI(prompt);
      
      const aiResponse = {
        id: messages.length + 2,
        text: aiResponseText,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      const errorMessage = {
        id: messages.length + 2,
        text: "I'm sorry, I encountered an error while processing your request. Please try again.",
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessing(false);
      scrollToBottom();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="math-chatbot">
      {/* Floating Action Button */}
      <button 
        className={`fab-button ${isOpen ? 'active' : ''}`} 
        onClick={toggleChat}
        aria-label="Open math assistant"
      >
        {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
      </button>
      
      {/* Chat Window */}
      {isOpen && (
        <div className="chat-window">
          <div className="chat-header">
            <div className="header-info">
              <Bot size={20} />
              <h3>Math Assistant</h3>
            </div>
            <div className="header-tabs">
              <button 
                className={`tab-button ${activeTab === 'chat' ? 'active' : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </button>
              <button 
                className={`tab-button ${activeTab === 'study' ? 'active' : ''}`}
                onClick={() => setActiveTab('study')}
              >
                Study Tools
              </button>
            </div>
            <button className="close-button" onClick={toggleChat}>
              <X size={18} />
            </button>
          </div>
          
          {/* Add OCR Progress Indicator */}
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
          
          {activeTab === 'chat' && (
            <>
              <div className="chat-messages">
                {messages.map((message) => (
                  <div 
                    key={message.id} 
                    className={`message ${message.sender}`}
                  >
                    <div className="message-content">
                      {message.sender === 'ai' && <Bot size={16} className="message-icon" />}
                      {message.sender === 'user' && <User size={16} className="message-icon" />}
                      <div className="message-text">
                        <RichText text={message.text} />
                      </div>
                    </div>
                    <div className="message-time">
                      {formatTime(message.timestamp)}
                    </div>
                  </div>
                ))}
                {isProcessing && (
                  <div className="message ai">
                    <div className="message-content">
                      <Bot size={16} className="message-icon" />
                      <div className="message-text processing">
                        <span>Processing your request</span>
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              
              <div className="chat-input-container">
                <div className="file-upload">
                  <label htmlFor="file-upload" className="file-upload-label">
                    <Upload size={18} />
                    <span>Upload Document</span>
                  </label>
                  <input 
                    id="file-upload"
                    type="file" 
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                    onChange={handleFileUpload}
                    style={{ display: 'none' }}
                  />
                </div>
                
                <div className="input-area">
                  <textarea
                    value={inputValue}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask a math question..."
                    rows={1}
                  />
                  <button 
                    className="send-button" 
                    onClick={handleSendMessage}
                    disabled={inputValue.trim() === '' || isProcessing}
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'study' && (
            <div className="study-tools">
              <div className="study-options">
                <div className="study-option" onClick={() => window.location.href = '/ai-study'}>
                  <BookOpen size={24} />
                  <span>Generate Quizzes</span>
                </div>
                <div className="study-option" onClick={() => window.location.href = '/ai-study?tab=flashcards'}>
                  <Brain size={24} />
                  <span>Create Flashcards</span>
                </div>
              </div>
              <div className="study-info">
                <p>Upload documents and generate personalized study materials to enhance your learning experience.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MathChatbot;
