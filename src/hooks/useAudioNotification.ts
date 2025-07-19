import { useRef, useCallback } from 'react';

export const useAudioNotification = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotification = useCallback(() => {
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio('/sounds/notification.mp3');
        audioRef.current.volume = 0.7;
      }
      audioRef.current.play().catch(console.error);
    } catch (error) {
      console.error('Audio notification failed:', error);
    }
  }, []);

  return { playNotification };
};
