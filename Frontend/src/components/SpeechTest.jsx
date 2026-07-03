import { useState, useEffect } from 'react';

const SpeechTest = () => {
  const [voices, setVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [message, setMessage] = useState('New ride request received. Please check your dashboard.');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    // Load voices when component mounts
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      console.log('Available voices:', availableVoices);
      
      // Try to find a default voice
      const defaultVoice = availableVoices.find(v => v.lang.startsWith('en')) || 
                         availableVoices[0];
      if (defaultVoice) {
        setSelectedVoice(defaultVoice.voiceURI);
      }
    };

    loadVoices();
    
    // Some browsers require this event to load voices
    window.speechSynthesis.onvoiceschanged = loadVoices;
    
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const speak = () => {
    if (!window.speechSynthesis) {
      setStatus('Speech synthesis not supported in this browser');
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(message);
    
    // Set the selected voice
    if (selectedVoice) {
      const voice = voices.find(v => v.voiceURI === selectedVoice);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      }
    }
    
    utterance.rate = 0.9;
    utterance.volume = 1.0;
    
    utterance.onstart = () => {
      setIsSpeaking(true);
      setStatus('Speaking...');
    };
    
    utterance.onend = () => {
      setIsSpeaking(false);
      setStatus('Speech completed');
    };
    
    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setStatus(`Error: ${e.error}`);
      setIsSpeaking(false);
    };
    
    try {
      console.log('Speaking with voice:', utterance.voice);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error('Failed to speak:', e);
      setStatus(`Failed to speak: ${e.message}`);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Speech Synthesis Test</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          Message:
          <input 
            type="text" 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          />
        </label>
      </div>
      
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '10px' }}>
          Select Voice:
          <select 
            value={selectedVoice}
            onChange={(e) => setSelectedVoice(e.target.value)}
            style={{ width: '100%', padding: '8px', marginTop: '5px' }}
          >
            {voices.map(voice => (
              <option key={voice.voiceURI} value={voice.voiceURI}>
                {voice.name} ({voice.lang}) {voice.default ? ' [Default]' : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
      
      <div>
        <button 
          onClick={speak} 
          disabled={isSpeaking}
          style={{
            padding: '10px 20px',
            backgroundColor: isSpeaking ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isSpeaking ? 'not-allowed' : 'pointer',
            marginRight: '10px'
          }}
        >
          {isSpeaking ? 'Speaking...' : 'Speak'}
        </button>
        
        <button 
          onClick={() => window.speechSynthesis.cancel()}
          style={{
            padding: '10px 20px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Stop
        </button>
      </div>
      
      <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
        <h4>Status: {status || 'Ready'}</h4>
        <h4>Available Voices:</h4>
        <ul>
          {voices.map(voice => (
            <li key={voice.voiceURI}>
              {voice.name} - {voice.lang} {voice.default ? ' (Default)' : ''}
            </li>
          ))}
        </ul>
      </div>
      
      <div style={{ marginTop: '20px', color: '#666' }}>
        <p><strong>Note:</strong> If you don't hear anything, please check:</p>
        <ul>
          <li>Your system's volume is turned up</li>
          <li>Browser has permission to use speech synthesis</li>
          <li>Your system has TTS voices installed</li>
        </ul>
      </div>
    </div>
  );
};

export default SpeechTest;
