// LanguageSelector.jsx
import { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';

const LANGUAGES = [
  { code: 'en',    native: 'English',   english: 'English'    },
  { code: 'hi',    native: 'हिन्दी',     english: 'Hindi'      },
  { code: 'mr',    native: 'मराठी',      english: 'Marathi'    },
  { code: 'bn',    native: 'বাংলা',      english: 'Bengali'    },
  { code: 'ta',    native: 'தமிழ்',      english: 'Tamil'      },
  { code: 'te',    native: 'తెలుగు',     english: 'Telugu'     },
  { code: 'kn',    native: 'ಕನ್ನಡ',     english: 'Kannada'    },
  { code: 'ml',    native: 'മലയാളം',    english: 'Malayalam'  },
  { code: 'gu',    native: 'ગુજરાતી',   english: 'Gujarati'   },
  { code: 'pa',    native: 'ਪੰਜਾਬੀ',    english: 'Punjabi'    },
  { code: 'fr',    native: 'Français',  english: 'French'     },
  { code: 'de',    native: 'Deutsch',   english: 'German'     },
  { code: 'es',    native: 'Español',   english: 'Spanish'    },
  { code: 'ar',    native: 'العربية',   english: 'Arabic'     },
  { code: 'zh-CN', native: '中文',       english: 'Chinese'    },
  { code: 'ja',    native: '日本語',     english: 'Japanese'   },
  { code: 'ko',    native: '한국어',     english: 'Korean'     },
  { code: 'ru',    native: 'Русский',   english: 'Russian'    },
  { code: 'pt',    native: 'Português', english: 'Portuguese' },
];

function getCurrentLang() {
  try {
    const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
    return match ? decodeURIComponent(match[1]) : 'en';
  } catch {
    return 'en';
  }
}

function setCookie(langCode) {
  const value = `/en/${langCode}`;
  // Set on explicit hostname (needed for non-localhost deployments)
  document.cookie = `googtrans=${value}; path=/; domain=${location.hostname}`;
  // Also set without domain (covers localhost)
  document.cookie = `googtrans=${value}; path=/`;
}

function clearCookie() {
  const past = 'Thu, 01 Jan 1970 00:00:00 GMT';
  document.cookie = `googtrans=; path=/; expires=${past}; domain=${location.hostname}`;
  document.cookie = `googtrans=; path=/; expires=${past}`;
}

export default function LanguageSelector() {
  const [open, setOpen]       = useState(false);
  const [current, setCurrent] = useState(getCurrentLang);
  const ref                   = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const changeLanguage = (code) => {
    if (code === current) { setOpen(false); return; }
    setOpen(false);
    setCurrent(code);

    if (code === 'en') {
      clearCookie();
      location.reload();
      return;
    }

    // Set the googtrans cookie then reload.
    // Google Translate reads this cookie on page load and translates
    // the page in-place — no proxy redirect, works on localhost too.
    setCookie(code);
    location.reload();
  };

  const activeLang = LANGUAGES.find((l) => l.code === current) || LANGUAGES[0];

  return (
    <div
      ref={ref}
      style={{
        position  : 'fixed',
        top       : '12px',
        right     : '160px',
        zIndex    : 999999,
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Pill trigger */}
      <button
        onClick={() => setOpen((o) => !o)}
        title="Change Language"
        style={{
          display             : 'flex',
          alignItems          : 'center',
          gap                 : '5px',
          padding             : '5px 11px',
          borderRadius        : '999px',
          border              : '1px solid rgba(255,255,255,0.28)',
          background          : 'rgba(20,20,20,0.60)',
          backdropFilter      : 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          color               : '#fff',
          fontSize            : '12.5px',
          fontWeight          : 600,
          cursor              : 'pointer',
          boxShadow           : '0 2px 12px rgba(0,0,0,0.25)',
          letterSpacing       : '0.01em',
          userSelect          : 'none',
          transition          : 'background 0.15s, box-shadow 0.15s',
          whiteSpace          : 'nowrap',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(20,20,20,0.80)';
          e.currentTarget.style.boxShadow  = '0 4px 16px rgba(0,0,0,0.30)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(20,20,20,0.60)';
          e.currentTarget.style.boxShadow  = '0 2px 12px rgba(0,0,0,0.25)';
        }}
      >
        <Globe size={13} strokeWidth={2} />
        <span>{activeLang.native}</span>
        <span style={{ fontSize: '9px', opacity: 0.65 }}>▾</span>
      </button>

      {/* Dropdown */}
      {open && (
        <div
          style={{
            position    : 'absolute',
            top         : 'calc(100% + 8px)',
            right       : 0,
            minWidth    : '190px',
            background  : '#ffffff',
            borderRadius: '14px',
            boxShadow   : '0 8px 40px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.08)',
            border      : '1px solid #efefef',
            overflow    : 'hidden',
            animation   : 'langDropIn 0.15s ease-out both',
          }}
        >
          <style>{`
            @keyframes langDropIn {
              from { opacity:0; transform:translateY(-8px) scale(0.97); }
              to   { opacity:1; transform:translateY(0)   scale(1);    }
            }
          `}</style>

          {/* Header */}
          <div style={{
            padding      : '10px 14px 8px',
            fontSize     : '10px',
            fontWeight   : 700,
            color        : '#b0b0b0',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            borderBottom : '1px solid #f3f3f3',
          }}>
            Select Language
          </div>

          {/* Language list */}
          <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
            {LANGUAGES.map((lang) => {
              const isActive = lang.code === current;
              return (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  style={{
                    display       : 'flex',
                    alignItems    : 'center',
                    justifyContent: 'space-between',
                    width         : '100%',
                    padding       : '8px 14px',
                    fontSize      : '13px',
                    fontWeight    : isActive ? 600 : 400,
                    color         : isActive ? '#f97316' : '#374151',
                    background    : isActive ? '#fff7ed' : 'transparent',
                    border        : 'none',
                    borderLeft    : isActive ? '3px solid #f97316' : '3px solid transparent',
                    cursor        : 'pointer',
                    textAlign     : 'left',
                    transition    : 'background 0.1s',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = '#f9fafb';
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{lang.native}</span>
                  <span style={{ fontSize: '11px', color: '#bbb', marginLeft: '8px' }}>
                    {lang.english}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}