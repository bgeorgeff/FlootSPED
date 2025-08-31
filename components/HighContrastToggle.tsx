import React from 'react';
import { Switch } from './Switch';
import { Contrast } from 'lucide-react';
import { useAccessibility } from '../helpers/useAccessibility';
import styles from './HighContrastToggle.module.css';

export const HighContrastToggle = ({ className }: { className?: string }) => {
  const { settings, toggleHighContrast } = useAccessibility();

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <div className={styles.labelWrapper}>
        <Contrast size={16} className={styles.icon} />
        <label htmlFor="high-contrast-toggle" className={styles.label}>
          High Contrast Mode
        </label>
      </div>
      <Switch
        id="high-contrast-toggle"
        checked={settings.isHighContrast}
        onCheckedChange={toggleHighContrast}
        aria-label="Toggle High Contrast Mode"
      />
    </div>
  );
};