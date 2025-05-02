
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
      
      /* Ensure full width for all sections */
      .landing-page > section,
      .landing-page > div > section,
      .landing-page > footer {
        width: 100%;
      }
      
      /* Fix for the container on larger screens */
      @media (min-width: 1400px) {
        .container {
          max-width: 1320px;
        }
      }
      `}
    </style>
  );
};

export default AnimationStyles;
