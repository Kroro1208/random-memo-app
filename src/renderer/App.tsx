/**
 * Main React App Component
 */

import React from 'react';

function App() {
  return (
    <div className="h-screen w-screen bg-transparent overflow-hidden">
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">
            Random Memo App
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Your desktop sticky notes companion
          </p>
          <div className="space-x-4">
            <button className="btn-primary">
              Create First Memo
            </button>
            <button className="btn-secondary">
              Settings
            </button>
          </div>
          <div className="mt-8 text-xs text-gray-500">
            Press Ctrl+Shift+N to create a memo anywhere
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;