import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';

const DevModeBanner = () => {
  const navigate = useNavigate();

  const disableDevMode = () => {
    localStorage.removeItem('dev_bypass');
    // optionally log out if auth context has signOut, but dev mode has no user
    navigate('/auth');
  };

  return (
    <div className="w-full bg-yellow-100 border-b border-yellow-300 text-yellow-800 text-center py-2">
      <span className="mr-4">Development mode active</span>
      <Button size="sm" variant="outline" onClick={disableDevMode} className="text-xs">
        Exit Dev Mode
      </Button>
    </div>
  );
};

export default DevModeBanner;
