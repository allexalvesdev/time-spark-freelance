
import React, { useEffect, useState } from 'react';
import { usePlatform } from '@/hooks/use-platform';

const SplashScreen: React.FC<{ onFinished: () => void }> = ({ onFinished }) => {
  const [isVisible, setIsVisible] = useState(true);
  const { isNative } = usePlatform();
  
  useEffect(() => {
    // Only show splash screen in native app
    if (!isNative) {
      onFinished();
      return;
    }
    
    // Show splash for 2 seconds then trigger animation
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Wait for animation to complete before calling onFinished
      setTimeout(onFinished, 500);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [isNative, onFinished]);
  
  // Don't render anything if we're not in native mode
  if (!isNative) return null;
  
  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-primary transition-opacity duration-500 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
            <span className="text-primary text-4xl font-bold">W</span>
          </div>
        </div>
        <h1 className="text-4xl font-bold mb-2 text-white">
          Workly<span className="text-accent">.</span>
        </h1>
        <p className="text-white opacity-80">Gerencie seu tempo, potencialize seus resultados</p>
      </div>
    </div>
  );
};

export default SplashScreen;
