import React from 'react';
import ReactMarkdown from 'react-markdown';

const SummaryTab = ({ fetchSummary, summary }) => {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Document Summary</h2>
        <button 
          onClick={fetchSummary} 
          className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition-colors"
        >
          Generate Summary
        </button>
      </div>
      <div className="prose max-w-none text-gray-700 bg-gray-50 p-6 rounded-lg">
        {summary ? (
          <ReactMarkdown>{summary}</ReactMarkdown>
        ) : (
          <p className="text-gray-400 italic">No summary generated yet.</p>
        )}
      </div>
    </div>
  );
};

export default SummaryTab;