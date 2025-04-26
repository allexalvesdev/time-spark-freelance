
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Get the html element and add script to check for dark mode preference
const htmlElement = document.documentElement;
const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
if (isDarkMode) {
  htmlElement.classList.add('dark');
}

createRoot(document.getElementById("root")!).render(<App />);
