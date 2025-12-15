import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, ChevronRight, FileText, Loader2, HelpCircle, AlignLeft } from 'lucide-react';

const API_BASE = "http://127.0.0.1:8000";

const LibraryTab = ({ onLoadQuiz, onLoadSummary }) => {
  const [activeCategory, setActiveCategory] = useState('summaries'); // 'summaries' or 'quizzes'
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLibrary();
  }, [activeCategory]);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      // Fetch from the correct endpoint based on category
      const endpoint = activeCategory === 'quizzes' ? '/library' : '/library/summaries';
      const res = await axios.get(`${API_BASE}${endpoint}`);
      setFiles(res.data.files);
    } catch (error) {
      console.error("Failed to load library");
    }
    setLoading(false);
  };

  const handleLoadClick = async (filename) => {
    setLoading(true);
    try {
      if (activeCategory === 'quizzes') {
        const res = await axios.get(`${API_BASE}/library/${filename}`);
        onLoadQuiz(res.data.quiz);
      } else {
        const res = await axios.get(`${API_BASE}/library/summaries/${filename}`);
        onLoadSummary(res.data.summary);
      }
    } catch (error) {
      alert("Error loading file.");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row items-center justify-between mb-8 border-b pb-4 gap-4">
        <div className="flex items-center gap-3">
          <BookOpen className="text-indigo-600" size={32} />
          <h2 className="text-2xl font-bold text-gray-800">Library</h2>
        </div>

        {/* Toggle Buttons */}
        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveCategory('summaries')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeCategory === 'summaries' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <AlignLeft size={18} /> Summaries
          </button>
          <button
            onClick={() => setActiveCategory('quizzes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
              activeCategory === 'quizzes' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <HelpCircle size={18} /> Quizzes
          </button>
        </div>
      </div>

      {loading && files.length === 0 && (
        <div className="text-center py-12 text-indigo-500">
          <Loader2 className="animate-spin mx-auto mb-2" /> Loading...
        </div>
      )}

      {!loading && files.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">No saved {activeCategory} found.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {files.map((file, idx) => (
          <button
            key={idx}
            onClick={() => handleLoadClick(file)}
            className="flex items-center justify-between p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md hover:border-indigo-300 transition-all group text-left"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg group-hover:text-white transition-colors ${
                activeCategory === 'quizzes' 
                  ? 'bg-purple-50 text-purple-600 group-hover:bg-purple-600' 
                  : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600'
              }`}>
                {activeCategory === 'quizzes' ? <HelpCircle size={24} /> : <AlignLeft size={24} />}
              </div>
              <div>
                <h3 className="font-bold text-gray-700 group-hover:text-indigo-700 transition-colors">
                  {file}
                </h3>
                <p className="text-xs text-gray-400 mt-1 capitalize">Saved {activeCategory === 'quizzes' ? 'Quiz' : 'Summary'}</p>
              </div>
            </div>
            <ChevronRight className="text-gray-300 group-hover:text-indigo-500" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default LibraryTab;