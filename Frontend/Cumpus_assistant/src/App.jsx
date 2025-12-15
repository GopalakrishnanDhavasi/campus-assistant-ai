import React, { useState } from 'react';
import axios from 'axios';
import { 
  Upload, 
  FileText, 
  MessageSquare, 
  HelpCircle, 
  BookOpen, 
  Loader2, 
  Save 
} from 'lucide-react';

// Import Components
import UploadTab from './components/UploadTab';
import SummaryTab from './components/SummaryTab';
import ChatTab from './components/ChatTab';
import QuizTab from './components/QuizTab';
import LibraryTab from './components/LibraryTab';

const API_BASE = "http://127.0.0.1:8000";

function App() {
  // --- UI States ---
  const [activeTab, setActiveTab] = useState('upload');
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  
  // --- Data States ---
  const [summary, setSummary] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [question, setQuestion] = useState("");
  const [quiz, setQuiz] = useState([]);
  
  // Stores the name of the first uploaded file to use as a default save name
  const [currentFileName, setCurrentFileName] = useState(""); 

  // --- Handlers ---

  const handleUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    // Save the first file's name as the default "Session Name"
    // e.g., "lecture1.pdf" -> "lecture1"
    setCurrentFileName(files[0].name.split('.')[0]); 

    const formData = new FormData();
    // Append all selected files
    Array.from(files).forEach((file) => formData.append("files", file));
    
    setLoading(true);
    setStatusMsg(`Uploading and merging ${files.length} file(s)...`);
    
    try {
      const res = await axios.post(`${API_BASE}/upload`, formData);
      setStatusMsg(res.data.message);
      alert("Success! Documents merged into knowledge base.");
      setActiveTab('summary'); // Auto-switch to summary
    } catch (error) {
      console.error(error);
      setStatusMsg("Error uploading files. Check console.");
    }
    setLoading(false);
  };

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/summarize`);
      setSummary(res.data.summary);
    } catch (error) {
      alert("Failed to fetch summary.");
    }
    setLoading(false);
  };

  const handleChat = async () => {
    if (!question.trim()) return;
    
    const newHistory = [...chatHistory, { role: 'user', content: question }];
    setChatHistory(newHistory);
    setQuestion("");
    
    // Optimistic UI update
    setChatHistory([...newHistory, { role: 'bot', content: "..." }]);

    try {
      const res = await axios.post(`${API_BASE}/chat`, { query: question });
      setChatHistory([...newHistory, { role: 'bot', content: res.data.response }]);
    } catch (error) {
      setChatHistory([...newHistory, { role: 'bot', content: "Error connecting to AI." }]);
    }
  };

  const fetchQuiz = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/quiz`);
      setQuiz(res.data.quiz);
    } catch (error) {
      alert("Failed to generate quiz.");
    }
    setLoading(false);
  };

  // --- SAVE HANDLER (Unified) ---
  const handleSave = async () => {
    // 1. SAVE SUMMARY
    if (activeTab === 'summary') {
      if (!summary) return alert("No summary to save!");
      
      const defaultName = currentFileName ? `${currentFileName}_summary` : "summary";
      const name = prompt("Enter a name for this summary:", defaultName);
      if (!name) return;
      
      try {
        await axios.post(`${API_BASE}/save_summary`, { filename: name, summary_text: summary });
        alert("Summary saved to Library!");
      } catch (e) { 
        alert("Failed to save summary."); 
      }
    } 
    // 2. SAVE QUIZ
    else if (activeTab === 'quiz') {
      if (quiz.length === 0) return alert("No quiz to save!");
      
      const defaultName = currentFileName ? `${currentFileName}_quiz` : "quiz";
      const name = prompt("Enter a name for this quiz:", defaultName);
      if (!name) return;

      try {
        await axios.post(`${API_BASE}/save_quiz`, { filename: name, quiz_data: quiz });
        alert("Quiz saved to Library!");
      } catch (e) { 
        alert("Failed to save quiz."); 
      }
    }
  };

  // --- LIBRARY LOAD HANDLERS ---
  const handleLoadQuizFromLibrary = (loadedQuizData) => {
    setQuiz(loadedQuizData);
    setActiveTab('quiz'); // Switch to quiz tab to play it
  };

  const handleLoadSummaryFromLibrary = (loadedSummaryText) => {
    setSummary(loadedSummaryText);
    setActiveTab('summary'); // Switch to summary tab to read it
  };

  // --- Sidebar Config ---
  const menuItems = [
    { id: 'upload', icon: Upload, label: 'Upload Files' },
    { id: 'summary', icon: FileText, label: 'Summary' },
    { id: 'chat', icon: MessageSquare, label: 'Q&A Chat' },
    { id: 'quiz', icon: HelpCircle, label: 'Practice Quiz' },
    { id: 'library', icon: BookOpen, label: 'Saved Library' },
  ];

  // --- Render ---

  return (
    <div className="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-64 bg-indigo-900 text-white flex flex-col shadow-2xl shrink-0">
        <div className="p-6 border-b border-indigo-800 flex items-center gap-3">
          <div className="bg-indigo-500 p-2 rounded-lg">
            <FileText size={24} className="text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Campus AI</h1>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                activeTab === item.id 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-indigo-200 hover:bg-indigo-800 hover:text-white'
              }`}
            >
              <item.icon size={20} className={`${activeTab === item.id ? 'text-white' : 'text-indigo-300 group-hover:text-white'}`} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-indigo-800 text-xs text-indigo-400 text-center">
          &copy; 2025 Campus Assistant
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* TOP HEADER */}
        <header className="bg-white shadow-sm px-8 py-4 flex justify-between items-center z-10 shrink-0">
          <h2 className="text-2xl font-bold text-gray-800 capitalize">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          
          <div className="flex items-center gap-4">
             {/* Dynamic Save Button: Shows on both Quiz AND Summary tabs if data exists */}
             {(activeTab === 'quiz' && quiz.length > 0) || (activeTab === 'summary' && summary) ? (
               <button 
                 onClick={handleSave}
                 className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-lg hover:bg-indigo-100 font-bold transition-colors border border-indigo-100"
               >
                 <Save size={18} /> Save {activeTab === 'quiz' ? 'Quiz' : 'Summary'}
               </button>
             ) : null}
             
             {loading && (
              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full text-sm font-medium animate-pulse">
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </div>
            )}
          </div>
        </header>

        {/* SCROLLABLE PAGE CONTENT */}
        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[500px] p-8">
            
            {activeTab === 'upload' && (
              <UploadTab 
                loading={loading} 
                handleUpload={handleUpload} 
                statusMsg={statusMsg} 
              />
            )}

            {activeTab === 'summary' && (
              <SummaryTab 
                fetchSummary={fetchSummary} 
                summary={summary} 
              />
            )}

            {activeTab === 'chat' && (
              <ChatTab 
                chatHistory={chatHistory} 
                question={question} 
                setQuestion={setQuestion} 
                handleChat={handleChat} 
              />
            )}

            {activeTab === 'quiz' && (
              <QuizTab 
                fetchQuiz={fetchQuiz} 
                quiz={quiz} 
              />
            )}
            
            {activeTab === 'library' && (
              <LibraryTab 
                onLoadQuiz={handleLoadQuizFromLibrary} 
                onLoadSummary={handleLoadSummaryFromLibrary} 
              />
            )}

          </div>
        </div>
      </main>
    </div>
  );
}

export default App;