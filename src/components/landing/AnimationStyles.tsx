
import React from 'react';

const AnimationStyles = () => {
  return (
    <style>
      {`
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      
      .animate-fade-in {
        animation: fadeIn 0.6s ease-out forwards;
        opacity: 0;
      }
      `}
    </style>
  );
};

export default AnimationStyles;
