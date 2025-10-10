// OAuth popup handler for Decap CMS
console.log('[decap-oauth] override-login.client.js loaded');

// Listen for OAuth completion messages from popup
window.addEventListener('message', function(event) {
  // Only accept messages from same origin
  if (event.origin !== window.location.origin) {
    return;
  }
  
  console.log('[decap-oauth] received message:', event.data);
  
  // Handle OAuth success message
  if (event.data && event.data.message === 'authorization:github:success') {
    console.log('[decap-oauth] OAuth success received');
    
    // Store token in localStorage for Decap CMS
    if (event.data.token) {
      localStorage.setItem('netlify-cms-user', JSON.stringify({
        token: event.data.token,
        provider: event.data.provider,
        site_id: event.data.site_id
      }));
      
      console.log('[decap-oauth] Token stored in localStorage');
      
      // Reload page to initialize CMS with new token
      setTimeout(() => {
        console.log('[decap-oauth] Reloading page to initialize CMS...');
        window.location.reload();
      }, 500);
    }
  }
});

// Auto-click login button if token exists (for development/testing)
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(() => {
    const token = localStorage.getItem('netlify-cms-user');
    if (token) {
      console.log('[decap-oauth] Token found, checking if CMS is ready...');
      
      // Try to click login button automatically
      const loginButton = document.querySelector('button[class*="LoginButton"]');
      if (loginButton && !document.querySelector('.nc-root')) {
        console.log('[decap-oauth] Auto-clicking login button...');
        loginButton.click();
      }
    }
  }, 1000);
});

console.log('[decap-oauth] OAuth handler initialized');
