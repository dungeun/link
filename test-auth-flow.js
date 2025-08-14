#!/usr/bin/env node

// Test authentication flow and localStorage
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true 
  });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  
  try {
    // Navigate to login page
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3005/login', { 
      waitUntil: 'networkidle0' 
    });
    
    // Fill login form
    console.log('Filling login form...');
    await page.type('input[type="email"]', 'influencer1@example.com');
    await page.type('input[type="password"]', 'password123');
    
    // Submit form
    console.log('Submitting form...');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
    
    // Wait a moment for auth to process
    await page.waitForTimeout(2000);
    
    // Check localStorage
    const localStorage = await page.evaluate(() => {
      return {
        accessToken: window.localStorage.getItem('accessToken'),
        authToken: window.localStorage.getItem('auth-token'),
        user: window.localStorage.getItem('user')
      };
    });
    
    console.log('LocalStorage after login:', localStorage);
    
    // Check cookies
    const cookies = await page.cookies();
    const authCookies = cookies.filter(c => 
      c.name === 'accessToken' || c.name === 'auth-token'
    );
    
    console.log('Auth cookies:', authCookies);
    
    // Navigate to home page
    console.log('Navigating to home page...');
    await page.goto('http://localhost:3005', { 
      waitUntil: 'networkidle0' 
    });
    
    // Check if login button is still visible
    const loginButtonVisible = await page.evaluate(() => {
      const loginLink = document.querySelector('a[href="/login"]');
      return loginLink ? loginLink.offsetParent !== null : false;
    });
    
    console.log('Login button visible on home page:', loginButtonVisible);
    
    // Check auth state in React
    const authState = await page.evaluate(() => {
      // Try to access React DevTools if available
      const reactFiber = document.querySelector('#__next')?._reactRootContainer?._internalRoot?.current;
      if (reactFiber) {
        // This would need React DevTools to work properly
        return 'React fiber found but cannot inspect hooks directly';
      }
      return 'Cannot access React internals';
    });
    
    console.log('Auth state check:', authState);
    
    // Keep browser open for manual inspection
    console.log('\nKeeping browser open for manual inspection...');
    console.log('Check the DevTools console for any errors.');
    console.log('Press Ctrl+C to exit.');
    
  } catch (error) {
    console.error('Error:', error);
  }
})();