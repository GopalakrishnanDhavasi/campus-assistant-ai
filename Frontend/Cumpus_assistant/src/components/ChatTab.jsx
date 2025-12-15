import React from 'react';
import { Send } from 'lucide-react';

const ChatTab = ({ chatHistory, question, setQuestion, handleChat }) => {
  return (
    <div className="flex flex-col h-[500px]">
      <div className="flex-1 overflow-y-auto mb-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
        {chatHistory.length === 0 && (
          <p className="text-center text-gray-400 mt-20">Ask a question about your document!</p>
        )}
        {chatHistory.map((msg, i) => (
          <div key={i} className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl ${
              msg.role === 'user' 
                ? 'bg-indigo-600 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 shadow-sm rounded-bl-none'
            }`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input 
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleChat()}
          className="flex-1 border border-gray-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Ask something..."
        />
        <button 
          onClick={handleChat} 
          className="bg-indigo-600 text-white p-3 rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
};

export default ChatTab;