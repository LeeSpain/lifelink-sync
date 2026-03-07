import React from "react";

const TestPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">React Test Page</h1>
        <p className="text-gray-600">If you can see this, React is working properly!</p>
        <button
          onClick={() => alert("Button clicked!")}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Button
        </button>
      </div>
    </div>
  );
};

export default TestPage;