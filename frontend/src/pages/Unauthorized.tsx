    import React from 'react';

const Unauthorized: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">403 - Forbidden</h1>
        <p className="text-gray-600">You don't have permission to access this page</p>
      </div>
    </div>
  );
};

export default Unauthorized;