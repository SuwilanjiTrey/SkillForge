// src/components/ai/QuizPlayer.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db, auth } from '../AnA/firebase';
import { doc, getDoc,  addDoc, collection ,updateDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, XCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import './styles/QuizPlayer.css';

const QuizPlayer = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        const user = auth.currentUser;
        if (!user) {
          navigate('/login');
          return;
        }

        const userDocRef = doc(db, 'users', user.uid);
        const quizzesCollectionRef = collection(userDocRef, 'quizzes');
        const quizDocRef = doc(quizzesCollectionRef, quizId);
        
        const quizDoc = await getDoc(quizDocRef);
        
        if (quizDoc.exists()) {
          setQuiz({
            id: quizDoc.id,
            ...quizDoc.data()
          });
        } else {
          navigate('/ai-study');
        }
      } catch (error) {
        console.error('Error loading quiz:', error);
        navigate('/ai-study');
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [quizId, navigate]);

  const handleOptionSelect = (index) => {
    if (!showResult) {
      setSelectedOption(index);
    }
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;

    const isCorrect = selectedOption === quiz.questions[currentQuestion].correctAnswer;
    const newAnswers = [...answers, {
      questionIndex: currentQuestion,
      selectedOption,
      isCorrect
    }];

    setAnswers(newAnswers);

    if (isCorrect) {
      setScore(score + 1);
    }

    setShowResult(true);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      saveQuizResult();
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSelectedOption(answers[currentQuestion - 1]?.selectedOption || null);
      setShowResult(!!answers[currentQuestion - 1]);
    }
  };

  const saveQuizResult = async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const userDocRef = doc(db, 'users', user.uid);
      const quizResultsCollectionRef = collection(userDocRef, 'quizResults');
      
      await addDoc(quizResultsCollectionRef, {
        quizId: quiz.id,
        quizTitle: quiz.title,
        score: score,
        totalQuestions: quiz.questions.length,
        percentage: Math.round((score / quiz.questions.length) * 100),
        answers: answers,
        completedAt: serverTimestamp()
      });

      // Update quiz with last taken date
      const quizzesCollectionRef = collection(userDocRef, 'quizzes');
      const quizDocRef = doc(quizzesCollectionRef, quizId);
      await updateDoc(quizDocRef, {
        lastTakenAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  };

  const restartQuiz = () => {
    setCurrentQuestion(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setAnswers([]);
    setQuizCompleted(false);
  };

  const exitQuiz = () => {
    navigate('/ai-study?tab=quizzes');
  };

  if (loading) {
    return <div className="loading">Loading quiz...</div>;
  }

  if (!quiz) {
    return <div className="error">Quiz not found</div>;
  }

  if (quizCompleted) {
    return (
      <div className="quiz-results">
        <div className="results-container">
          <h1>Quiz Results</h1>
          <div className="score-display">
            <div className="score-circle">
              <span>{Math.round((score / quiz.questions.length) * 100)}%</span>
            </div>
            <p>You scored {score} out of {quiz.questions.length}</p>
          </div>
          
          <div className="results-summary">
            <h2>Question Summary</h2>
            <div className="summary-list">
              {quiz.questions.map((question, index) => (
                <div key={index} className="summary-item">
                  <div className="summary-question">
                    <span>Q{index + 1}:</span> {question.question}
                  </div>
                  <div className="summary-answer">
                    <span>Your answer:</span> {question.options[answers[index]?.selectedOption]}
                    {answers[index]?.isCorrect ? (
                      <CheckCircle className="correct-icon" />
                    ) : (
                      <XCircle className="incorrect-icon" />
                    )}
                  </div>
                  {!answers[index]?.isCorrect && (
                    <div className="correct-answer">
                      <span>Correct answer:</span> {question.options[question.correctAnswer]}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className="results-actions">
            <button className="restart-button" onClick={restartQuiz}>
              Restart Quiz
            </button>
            <button className="exit-button" onClick={exitQuiz}>
              Back to Study Tools
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-player">
      <div className="quiz-header">
        <h1>{quiz.title}</h1>
        <div className="quiz-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
            ></div>
          </div>
          <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
        </div>
      </div>

      <div className="quiz-content">
        <div className="question-container">
          <h2>{quiz.questions[currentQuestion].question}</h2>
          
          <div className="options-container">
            {quiz.questions[currentQuestion].options.map((option, index) => (
              <div 
                key={index}
                className={`option ${selectedOption === index ? 'selected' : ''} ${
                  showResult && index === quiz.questions[currentQuestion].correctAnswer ? 'correct' : ''
                } ${
                  showResult && selectedOption === index && index !== quiz.questions[currentQuestion].correctAnswer ? 'incorrect' : ''
                }`}
                onClick={() => handleOptionSelect(index)}
              >
                <span className="option-label">{String.fromCharCode(65 + index)}.</span>
                <span className="option-text">{option}</span>
                {showResult && index === quiz.questions[currentQuestion].correctAnswer && (
                  <CheckCircle className="option-icon" />
                )}
                {showResult && selectedOption === index && index !== quiz.questions[currentQuestion].correctAnswer && (
                  <XCircle className="option-icon" />
                )}
              </div>
            ))}
          </div>
        </div>

        {showResult && (
          <div className="result-feedback">
            {selectedOption === quiz.questions[currentQuestion].correctAnswer ? (
              <div className="feedback correct">
                <CheckCircle />
                <span>Correct!</span>
              </div>
            ) : (
              <div className="feedback incorrect">
                <XCircle />
                <span>Incorrect. The correct answer is {String.fromCharCode(65 + quiz.questions[currentQuestion].correctAnswer)}.</span>
              </div>
            )}
          </div>
        )}

        <div className="quiz-actions">
          <button 
            className="action-button prev-button" 
            onClick={handlePrevQuestion}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft />
            Previous
          </button>
          
          {!showResult ? (
            <button 
              className="action-button submit-button" 
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
            >
              Submit Answer
            </button>
          ) : (
            <button 
              className="action-button next-button" 
              onClick={handleNextQuestion}
            >
              {currentQuestion < quiz.questions.length - 1 ? (
                <>
                  Next
                  <ArrowRight />
                </>
              ) : (
                'Finish Quiz'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPlayer;
