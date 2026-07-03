import { useState, useEffect } from 'react';

/**
 * A custom React hook for creating a typewriter effect.
 * @param {string} text The text to animate.
 * @param {number} speed The speed of typing in milliseconds.
 * @returns {string} The text that is currently displayed.
 */
const useTypewriter = (text, speed = 75) => {
  const [displayText, setDisplayText] = useState('');

  useEffect(() => {
    // Reset the animation when the text prop changes (e.g., new user logs in)
    setDisplayText('');

    if (text) {
      let i = 0;
      const typingInterval = setInterval(() => {
        if (i < text.length) {
          setDisplayText(prevText => prevText + text.charAt(i));
          i++;
        } else {
          clearInterval(typingInterval);
        }
      }, speed);

      // Cleanup function to clear the interval if the component unmounts
      return () => {
        clearInterval(typingInterval);
      };
    }
  }, [text, speed]); // Rerun effect if text or speed changes

  return displayText;
};

export default useTypewriter;