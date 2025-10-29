import React, { useEffect, useState } from 'react';

interface LoginSuccessAnimationProps {
  onComplete: () => void;
}

const LoginSuccessAnimation: React.FC<LoginSuccessAnimationProps> = ({ onComplete }) => {
  const [showSuccess, setShowSuccess] = useState(false);

  const playSuccessSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  };

  useEffect(() => {
    const loadingTimer = setTimeout(() => {
      setShowSuccess(true);
      playSuccessSound();
    }, 1000);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(loadingTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="flex flex-col items-center space-y-6">
        {!showSuccess ? (
          <>
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-8 border-seagreen-200 rounded-full"></div>
              <div className="absolute inset-0 border-8 border-seagreen-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <p className="text-lg font-medium text-gray-700">Authenticating...</p>
          </>
        ) : (
          <>
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 bg-green-100 rounded-full animate-scale-in"></div>
              <svg
                className="absolute inset-0 w-24 h-24 text-green-600 animate-checkmark"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M5 13l4 4L19 7"
                  className="checkmark-path"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-green-600 animate-fade-in">Login Successful!</p>
          </>
        )}
      </div>
    </div>
  );
};

export default LoginSuccessAnimation;
