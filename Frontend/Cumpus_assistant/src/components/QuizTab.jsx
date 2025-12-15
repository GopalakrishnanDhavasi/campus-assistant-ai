import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, AlertCircle, RefreshCw, Play, Settings } from 'lucide-react';

const QuizTab = ({ fetchQuiz, quiz }) => {
  // --- States ---
  const [userAnswers, setUserAnswers] = useState({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  
  // Timer & Flow States
  const [quizStarted, setQuizStarted] = useState(false); // Controls if questions are visible
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [customTimeMinutes, setCustomTimeMinutes] = useState(5); // Default 5 mins

  // --- Effects ---

  // 1. Reset everything when a NEW quiz loads from the backend
  useEffect(() => {
    if (quiz.length > 0) {
      setUserAnswers({});
      setIsSubmitted(false);
      setScore(0);
      setQuizStarted(false); // Don't start immediately
      setTimerActive(false);
    }
  }, [quiz]);

  // 2. Timer Countdown Logic
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && timerActive) {
      // Auto-submit when time runs out
      handleSubmit();
    }
    return () => clearInterval(interval);
  }, [timerActive, timeLeft]);

  // --- Handlers ---

  const handleStartQuiz = () => {
    setTimeLeft(customTimeMinutes * 60); // Convert mins to seconds
    setQuizStarted(true);
    setTimerActive(true);
  };

  const handleOptionSelect = (questionIndex, optionKey) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionKey,
    }));
  };

  const handleSubmit = () => {
    if (isSubmitted) return;

    let calculatedScore = 0;
    quiz.forEach((q, idx) => {
      if (userAnswers[idx] === q.correct_option) {
        calculatedScore += 1;
      }
    });

    setScore(calculatedScore);
    setIsSubmitted(true);
    setTimerActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const getOptionStyle = (q, optionKey, idx) => {
    if (!isSubmitted) {
      return userAnswers[idx] === optionKey
        ? "bg-indigo-100 border-indigo-500 text-indigo-700 shadow-inner"
        : "border-gray-200 hover:bg-gray-50";
    }
    const isSelected = userAnswers[idx] === optionKey;
    const isCorrect = q.correct_option === optionKey;
    if (isCorrect) return "bg-green-100 border-green-500 text-green-800 font-bold";
    if (isSelected && !isCorrect) return "bg-red-100 border-red-500 text-red-800";
    return "border-gray-200 opacity-50";
  };

  // --- Render ---

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <CheckCircle className="text-indigo-600" />
          Practice Quiz
        </h2>
        
        <div className="flex gap-4 items-center">
          {/* Active Timer Display */}
          {quizStarted && !isSubmitted && (
            <div className={`flex items-center gap-2 font-mono text-lg font-bold px-4 py-2 rounded-full shadow-inner ${timeLeft < 60 ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-blue-50 text-blue-600'}`}>
              <Clock size={20} />
              {formatTime(timeLeft)}
            </div>
          )}
          
          <button 
            onClick={fetchQuiz} 
            className="flex items-center gap-2 bg-white text-indigo-600 border border-indigo-200 px-4 py-2 rounded-lg hover:bg-indigo-50 transition-all text-sm font-medium"
          >
            <RefreshCw size={16} />
            {quiz.length > 0 ? "Generate New" : "Load Quiz"}
          </button>
        </div>
      </div>

      {/* --- SCENARIO 1: QUIZ LOADED BUT NOT STARTED (SETUP SCREEN) --- */}
      {quiz.length > 0 && !quizStarted && (
        <div className="bg-white rounded-xl shadow-lg p-10 text-center border border-indigo-100 animate-fade-in">
          <Settings size={48} className="mx-auto text-indigo-400 mb-4" />
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Quiz Ready!</h3>
          <p className="text-gray-500 mb-8">Customize your settings before you begin.</p>

          <div className="bg-gray-50 p-6 rounded-lg inline-block text-left mb-8">
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Set Timer (Minutes)
            </label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                min="1" 
                max="60"
                value={customTimeMinutes}
                onChange={(e) => setCustomTimeMinutes(parseInt(e.target.value) || 1)}
                className="w-24 p-2 border border-gray-300 rounded text-center text-lg font-bold focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
              <span className="text-gray-500">minutes</span>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Total Questions: <span className="font-bold text-gray-700">{quiz.length}</span>
            </p>
          </div>

          <div>
            <button 
              onClick={handleStartQuiz}
              className="bg-indigo-600 text-white text-lg font-bold px-10 py-4 rounded-full shadow-xl hover:bg-indigo-700 hover:scale-105 transition-all flex items-center gap-3 mx-auto"
            >
              Start Quiz Now <Play size={24} fill="currentColor" />
            </button>
          </div>
        </div>
      )}

      {/* --- SCENARIO 2: QUIZ ACTIVE OR SUBMITTED --- */}
      {quizStarted && (
        <div className="space-y-8 animate-slide-up">
          
          {/* Result Banner */}
          {isSubmitted && (
            <div className="mb-8 p-6 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl text-white shadow-lg text-center">
              <h3 className="text-3xl font-bold mb-2">Quiz Completed!</h3>
              <p className="text-xl opacity-90">
                You scored <span className="font-bold text-3xl bg-white text-indigo-600 px-3 py-1 rounded-lg mx-2">{score} / {quiz.length}</span>
              </p>
            </div>
          )}

          {/* Questions List */}
          {quiz.map((q, idx) => (
            <div key={idx} className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
              {q.options ? (
                <>
                  <div className="flex gap-4 mb-4">
                    <span className="bg-gray-100 text-gray-600 font-bold h-8 w-8 flex items-center justify-center rounded-full shrink-0">
                      {idx + 1}
                    </span>
                    <h3 className="text-lg font-semibold text-gray-800 leading-relaxed pt-0.5">{q.question}</h3>
                  </div>

                  <div className="grid grid-cols-1 gap-3 ml-12">
                    {Object.entries(q.options).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => handleOptionSelect(idx, key)}
                        disabled={isSubmitted}
                        className={`text-left p-4 rounded-lg border-2 transition-all duration-200 relative ${getOptionStyle(q, key, idx)}`}
                      >
                        <span className="font-bold mr-3 inline-block w-6">{key}.</span>
                        {val}
                        
                        {isSubmitted && q.correct_option === key && (
                          <CheckCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-green-600" size={20} />
                        )}
                        {isSubmitted && userAnswers[idx] === key && q.correct_option !== key && (
                          <XCircle className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500" size={20} />
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Explanation Box */}
                  {isSubmitted && (
                    <div className={`mt-6 ml-12 p-4 rounded-lg text-sm border-l-4 ${
                      userAnswers[idx] === q.correct_option ? "bg-green-50 border-green-400 text-green-800" : "bg-indigo-50 border-indigo-400 text-indigo-800"
                    }`}>
                      <p className="font-bold mb-1 flex items-center gap-2">
                        {userAnswers[idx] === q.correct_option ? "Correct! 🌟" : "Explanation 💡"}
                      </p>
                      <p>{q.explanation}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-red-500 p-4 bg-red-50 rounded-lg">
                  <p className="font-bold">Error loading question</p>
                </div>
              )}
            </div>
          ))}

          {/* Submit Button */}
          {!isSubmitted && (
            <div className="sticky bottom-6 mt-8 flex justify-center z-20">
              <button
                onClick={handleSubmit}
                className="bg-green-600 text-white text-lg font-bold px-12 py-4 rounded-full shadow-2xl hover:bg-green-700 hover:scale-105 transition-all flex items-center gap-2 ring-4 ring-white"
              >
                Submit Answers <CheckCircle size={24} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* --- SCENARIO 3: EMPTY STATE --- */}
      {quiz.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border-2 border-dashed border-gray-200">
          <AlertCircle className="mx-auto text-gray-300 mb-4" size={64} />
          <p className="text-gray-500 text-xl font-medium">No quiz generated yet.</p>
          <p className="text-gray-400 mb-6">Upload a document and click "Generate New Quiz".</p>
          <button 
            onClick={fetchQuiz}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Generate First Quiz
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizTab;