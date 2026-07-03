import React, { useState, useEffect } from 'react';

const ConsoleText = ({ words, colors, speed = 1020, blinkSpeed = 400 }) => {
    const [text, setText] = useState('');
    const [currentLetterCount, setCurrentLetterCount] = useState(1);
    const [isWaiting, setIsWaiting] = useState(false);
    const [currentWord, setCurrentWord] = useState(words[0]);
    const [currentColor, setCurrentColor] = useState(colors[0]);

    useEffect(() => {
        const intervalId = setInterval(() => {
            if (currentLetterCount === 0 && !isWaiting) {
                setIsWaiting(true);
                setText(currentWord.substring(0, currentLetterCount));

                setTimeout(() => {
                    const nextColor = colors.shift();
                    colors.push(nextColor);

                    const nextWord = words.shift();
                    words.push(nextWord);

                    setCurrentLetterCount(1);
                    setCurrentColor(nextColor);
                    setCurrentWord(nextWord);
                    setIsWaiting(false);
                }, 1000);
            } else if (currentLetterCount === currentWord.length + 1 && !isWaiting) {
                setIsWaiting(true);
                setTimeout(() => {
                    setCurrentLetterCount(currentLetterCount - 1);
                    setIsWaiting(false);
                }, 1000);
            } else if (!isWaiting) {
                setText(currentWord.substring(0, currentLetterCount));
                setCurrentLetterCount(currentLetterCount + (currentLetterCount === currentWord.length ? -1 : 1));
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [words, colors, speed, currentLetterCount, currentWord, isWaiting]); // Update dependencies

    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const blinkIntervalId = setInterval(() => {
            setIsVisible(!isVisible);
        }, blinkSpeed);

        return () => clearInterval(blinkIntervalId);
    }, [isVisible, blinkSpeed]);

    return (
        <div className="console-container">
            <span style={{ color: currentColor }}>{text}</span>
            <span className="console-underscore" style={{ visibility: isVisible ? 'visible' : 'hidden' }}>&#95;</span>
        </div>
    );
};

export default ConsoleText;
