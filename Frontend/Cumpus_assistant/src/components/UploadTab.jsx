import React, { useState } from 'react';
import { Upload, File, X, AlertCircle } from 'lucide-react';

const UploadTab = ({ loading, handleUpload, statusMsg }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [error, setError] = useState("");

  const onFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    // Validation: Max 5 files
    if (files.length > 5) {
      setError("You can only upload a maximum of 5 files.");
      return;
    }

    setError("");
    setSelectedFiles(files);
  };

  const onUploadClick = () => {
    if (selectedFiles.length === 0) {
      setError("Please select at least one file.");
      return;
    }
    handleUpload(selectedFiles);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center py-8">
        
        {/* Upload Box */}
        <div className="border-4 border-dashed border-indigo-100 rounded-xl p-10 hover:bg-indigo-50 transition-colors relative">
          <Upload className="mx-auto text-indigo-400 mb-4" size={64} />
          <p className="text-lg text-gray-600 mb-2 font-medium">
            Drag & drop or click to upload
          </p>
          <p className="text-sm text-gray-400 mb-6">
            Supported: PDF, DOCX, PPTX (Max 5 files)
          </p>
          
          <input 
            type="file" 
            multiple // <--- Enables multiple selection
            accept=".pdf,.docx,.pptx" 
            onChange={onFileChange} 
            disabled={loading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center justify-center gap-2 text-sm font-medium">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Selected Files List */}
        {selectedFiles.length > 0 && (
          <div className="mt-6 text-left bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Selected Documents ({selectedFiles.length})
            </div>
            <ul className="divide-y divide-gray-100">
              {selectedFiles.map((file, idx) => (
                <li key={idx} className="px-4 py-3 flex items-center gap-3">
                  <div className="bg-indigo-100 p-2 rounded text-indigo-600">
                    <File size={16} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium truncate flex-1">
                    {file.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <button
            onClick={onUploadClick}
            disabled={loading}
            className="mt-6 bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:shadow-none w-full md:w-auto"
          >
            {loading ? "Processing Files..." : `Upload ${selectedFiles.length} Document${selectedFiles.length > 1 ? 's' : ''}`}
          </button>
        )}

        {/* Server Status Message */}
        {statusMsg && !error && (
          <p className={`mt-4 font-medium ${statusMsg.includes("Error") ? "text-red-600" : "text-green-600"}`}>
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
};

export default UploadTab;