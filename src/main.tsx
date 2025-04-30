
import { createRoot } from 'react-dom/client'
import { Capacitor } from '@capacitor/core';
import App from './App.tsx'
import './index.css'

// Get the html element and add script to check for dark mode preference
const htmlElement = document.documentElement;
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (isDarkMode) {
  htmlElement.classList.add('dark');
}

// Wait for the device to be ready when running in native app mode
const initializeApp = async () => {
  if (Capacitor.isNativePlatform()) {
    try {
      // Set up native platform listeners and initializations
      console.log('Initializing Capacitor app');
      
      document.addEventListener('deviceready', () => {
        console.log('Device is ready in Capacitor native app');
      }, false);
      
      // Handle back button for Android
      document.addEventListener('backbutton', () => {
        console.log('Back button pressed in Android');
      }, false);
      
    } catch (error) {
      console.error('Error initializing Capacitor:', error);
    }
  } else {
    console.log('Running as web app');
  }
  
  createRoot(document.getElementById("root")!).render(<App />);
};

initializeApp();
