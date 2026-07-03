import { useCallback, useEffect, useRef, useState } from 'react';

export const useNotification = () => {
  const isSpeaking = useRef(false);
  const speechQueue = useRef([]);
  const [voices, setVoices] = useState([]);

  // Load available voices
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      console.log('Available voices:', availableVoices);
      setVoices(availableVoices);
    };

    loadVoices();
    
    if (window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

  const getBestVoice = useCallback(() => {
    // Try to find a Hindi voice first
    let voice = voices.find(v => v.lang.startsWith('hi'));
    
    // If no Hindi voice, try English
    if (!voice) {
      voice = voices.find(v => v.lang.startsWith('en'));
    }
    
    // If still no voice, use the first available one
    if (!voice && voices.length > 0) {
      voice = voices[0];
    }
    
    console.log('Selected voice:', voice);
    return voice;
  }, [voices]);

  const speak = useCallback(async (text) => {
    if (!window.speechSynthesis) {
      console.warn('Speech synthesis not supported');
      return;
    }

    return new Promise((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice and language
      const voice = getBestVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'en-US';
      }
      
      utterance.rate = 0.9;
      utterance.volume = 1.0;
      
      utterance.onend = () => {
        console.log('Speech synthesis completed');
        resolve();
      };
      
      utterance.onerror = (e) => {
        console.error('Speech synthesis error:', e);
        resolve();
      };
      
      console.log('Speaking:', text);
      window.speechSynthesis.speak(utterance);
    });
  }, [getBestVoice]);

  const playSound = useCallback(async () => {
    try {
      const audio = new Audio('/audio/notification.mp3');
      audio.preload = 'auto';
      
      return new Promise((resolve) => {
        audio.onended = resolve;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => console.log('Audio playback started'))
            .catch(e => {
              console.error('Playback failed:', e);
              resolve();
            });
        } else {
          resolve();
        }
      });
    } catch (e) {
      console.error('Error with audio:', e);
    }
  }, []);

  const playNotification = useCallback(async () => {
    try {
      console.log('Playing notification...');
      
      // Play sound first
      await playSound();
      
      // Then speak the message
      await speak('New ride request received. Please check your dashboard.');
      
    } catch (error) {
      console.error('Error in notification:', error);
    }
  }, [playSound, speak]);

  return { playNotification };
};

export default useNotification;
