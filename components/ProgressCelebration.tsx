import React, { useEffect } from 'react';
import { Award, PartyPopper, X } from 'lucide-react';
import { Button } from './Button';
import styles from './ProgressCelebration.module.css';

interface ProgressCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'achievement' | 'level-up' | 'streak';
  title: string;
  message: string;
}

const ICONS = {
  achievement: <Award size={64} />,
  'level-up': <PartyPopper size={64} />,
  streak: <PartyPopper size={64} />,
};

export const ProgressCelebration = ({
  isOpen,
  onClose,
  type,
  title,
  message,
}: ProgressCelebrationProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Play a sound effect
      // const audio = new Audio('/sounds/celebrate.mp3');
      // audio.play().catch(e => console.error("Error playing sound:", e));
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="celebration-title">
      <div className={styles.confetti}>
        {[...Array(10)].map((_, i) => <div key={i} className={styles.confettiPiece}></div>)}
      </div>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <Button variant="ghost" size="icon" className={styles.closeButton} onClick={onClose} aria-label="Close celebration">
          <X />
        </Button>
        <div className={`${styles.iconWrapper} ${styles[type]}`}>
          {ICONS[type]}
        </div>
        <h2 id="celebration-title" className={styles.title}>{title}</h2>
        <p className={styles.message}>{message}</p>
        <Button onClick={onClose} className={styles.continueButton}>
          Keep Reading!
        </Button>
      </div>
    </div>
  );
};