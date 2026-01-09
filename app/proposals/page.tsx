'use client';

import { useState } from 'react';

export default function ProposalsPage() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCreatePR = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      const response = await fetch('/api/create-pr', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Success! PR created: ${data.url}`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-center mb-2">Proposals</h1>
          <p className="text-center text-gray-600">
            Click the button below to create a pull request
          </p>
        </div>
        
        <div className="space-y-4">
          <button
            onClick={handleCreatePR}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            {loading ? 'Creating PR...' : 'Create Pull Request'}
          </button>
          
          {message && (
            <div className={`p-4 rounded-lg ${
              message.startsWith('Success') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
