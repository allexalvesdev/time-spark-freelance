
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.workly.timespark',
  appName: 'Workly',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#9B87F5",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true
    }
  },
  server: {
    url: "https://b036e618-b7bf-4b72-a4dc-86c099eefaa4.lovableproject.com?forceHideBadge=true",
    cleartext: true
  }
};

export default config;
