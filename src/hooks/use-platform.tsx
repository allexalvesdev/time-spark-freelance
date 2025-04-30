
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

type Platform = 'web' | 'ios' | 'android';

export function usePlatform() {
  const [platform, setPlatform] = useState<Platform>('web');
  const [isNative, setIsNative] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const detectPlatform = () => {
      const isNativeApp = Capacitor.isNativePlatform();
      setIsNative(isNativeApp);
      
      if (isNativeApp) {
        if (Capacitor.getPlatform() === 'ios') {
          setPlatform('ios');
        } else if (Capacitor.getPlatform() === 'android') {
          setPlatform('android');
        } else {
          setPlatform('web');
        }
      } else {
        setPlatform('web');
      }
      
      setIsReady(true);
    };

    detectPlatform();
    
    // Listen for platform ready event
    document.addEventListener('deviceready', () => {
      detectPlatform();
    });
    
    return () => {
      document.removeEventListener('deviceready', detectPlatform);
    };
  }, []);

  return { 
    platform, 
    isNative, 
    isWeb: platform === 'web', 
    isIOS: platform === 'ios', 
    isAndroid: platform === 'android',
    isReady
  };
}
