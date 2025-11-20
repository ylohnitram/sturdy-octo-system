
// Google Analytics 4 Service

export const initGA = (measurementId: string) => {
  if (!measurementId || measurementId === 'G-XXXXXXXXXX') {
    console.warn('GA4 Measurement ID not set.');
    return;
  }

  // 1. Load the script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  // 2. Initialize window.dataLayer
  window.dataLayer = window.dataLayer || [];
  // @ts-ignore
  function gtag(...args: any[]) {
    // @ts-ignore
    window.dataLayer.push(args);
  }
  gtag('js', new Date());
  gtag('config', measurementId);
  
  console.log('GA4 Initialized');
};

// Helper to track events
export const trackEvent = (eventName: string, params?: any) => {
  // @ts-ignore
  if (window.dataLayer) {
    // @ts-ignore
    window.dataLayer.push({
      event: eventName,
      ...params
    });
  }
};

// Add types to window
declare global {
  interface Window {
    dataLayer: any[];
  }
}
