// components/ImportProfile.tsx
import React from "react";

const ImportProfile: React.FC = () => {
  return (
    <div className="p-4 border rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-2">Import Profile</h2>
      <p className="text-gray-600 mb-4">
        Upload your resume (PDF) or connect LinkedIn to auto-fill your details.
      </p>
      
      <div className="space-y-3">
        {/* LinkedIn Import Button */}
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          Import from LinkedIn
        </button>

        {/* Resume Upload */}
        <input 
          type="file" 
          accept="application/pdf" 
          className="border p-2 rounded-md w-full"
        />
      </div>
    </div>
  );
};

export default ImportProfile;
