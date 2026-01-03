import React from 'react';
import LoginPage from '@/components/Layout/Login'; // Import your LoginPage component

const page = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      {/* Rendering LoginPage */}
      <LoginPage />
    </div>
  );
};

export default page;
