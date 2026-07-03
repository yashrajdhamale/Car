// Suppress Firestore cleardot.gif error in development
if (import.meta.env.DEV) {
  const originalError = console.error;
  console.error = function(message, ...args) {
    if (typeof message === 'string' && message.includes('cleardot.gif')) {
      return;
    }
    originalError.apply(console, [message, ...args]);
  };
}
