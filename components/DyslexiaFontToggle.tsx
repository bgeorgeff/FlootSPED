import React from 'react';
import { Switch } from './Switch';
import { BrainCircuit } from 'lucide-react';
import { useAccessibility } from '../helpers/useAccessibility';
import styles from './DyslexiaFontToggle.module.css';

export const DyslexiaFontToggle = ({ className }: { className?: string }) => {
  const { settings, toggleDyslexiaFont } = useAccessibility();

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <div className={styles.labelWrapper}>
        <BrainCircuit size={16} className={styles.icon} />
        <label htmlFor="dyslexia-font-toggle" className={styles.label}>
          Dyslexia Friendly Font
        </label>
      </div>
      <Switch
        id="dyslexia-font-toggle"
        checked={settings.isDyslexiaFont}
        onCheckedChange={toggleDyslexiaFont}
        aria-label="Toggle Dyslexia Friendly Font"
      />
    </div>
  );
};