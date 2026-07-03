import { useCallback, useRef } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const useNotification = () => {
  const tingRef = useRef(null);

  // Initialize the ting sound
  const initAudio = useCallback(() => {
    try {
      if (!tingRef.current) {
        tingRef.current = new Audio('/audio/ting.mp3');
        tingRef.current.load();
      }
      return true;
    } catch (e) {
      console.error('Failed to initialize audio:', e);
      return false;
    }
  }, []);

  // Speak Hinglish message using browser Speech Synthesis
  const speakHinglish = useCallback((text) => {
    try {
      // Cancel any previous speech if still playing
      window.speechSynthesis.cancel();

      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'en-IN'; // Indian English accent
      msg.rate = 0.95;    // Slightly slower for clarity
      msg.pitch = 1;      // Normal tone
      msg.volume = 1;     // Full volume
      speechSynthesis.speak(msg);
    } catch (error) {
      console.error('Speech synthesis error:', error);
    }
  }, []);

  // Play notification: Ting + Hinglish voice 3 times
  const playNotification = useCallback(async () => {
    try {
      if (!tingRef.current) {
        const success = initAudio();
        if (!success) return;
      }

      console.log('🔔 Playing Hinglish notification sequence...');

      // Show toast once
      toast.info('🚗 Naya ride request aaya hain!', {
        position: 'top-right',
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });

      const playSequence = async () => {
        try {
          // Play the ting sound
          tingRef.current.currentTime = 0;
          await tingRef.current.play();

          // Wait until ting finishes
          await new Promise((resolve) => {
            tingRef.current.onended = resolve;
          });

          // Speak the Hinglish voice line
          speakHinglish('Naya ride request aaya hain, kripaya apna dashboard check karein.');
        } catch (error) {
          console.error('Error during notification playback:', error);
        }
      };

      // Play the full sequence (ting + voice) 3 times
      for (let i = 0; i < 3; i++) {
        console.log(`🔊 Playing sequence ${i + 1}/3`);
        await playSequence();

        // Optional: short pause between repeats (1.5s)
        await new Promise((resolve) => setTimeout(resolve, 1500));
      }

      console.log('✅ Notification sequence completed.');
    } catch (error) {
      console.error('Error in playNotification:', error);
    }
  }, [initAudio, speakHinglish]);

  return { playNotification };
};
