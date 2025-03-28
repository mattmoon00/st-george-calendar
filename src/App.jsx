import React, { useState, useEffect } from 'react';
import DesktopCalendar from './assets/DesktopCalendar';
import MobileCalendar from './assets/MobileCalendar';
import './App.css';

function App() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 600);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="App">
      {isMobile ? <MobileCalendar /> : <DesktopCalendar />}
    </div>
  );
}
//test

export default App;
