import React from 'react';
import { Slider } from './Slider';
import { Separator } from './Separator';
import { DyslexiaFontToggle } from './DyslexiaFontToggle';
import { HighContrastToggle } from './HighContrastToggle';
import { useAccessibility } from '../helpers/useAccessibility';
import { Text, Palette, CaseSensitive, Rows3 } from 'lucide-react';
import styles from './AccessibilityControls.module.css';

export const AccessibilityControls = ({ className }: { className?: string }) => {
  const {
    settings,
    setFontSize,
    setLineHeight,
    setLetterSpacing,
    setColorTheme,
  } = useAccessibility();

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0]);
  };

  const handleLineHeightChange = (value: number[]) => {
    setLineHeight(value[0]);
  };

  const handleLetterSpacingChange = (value: number[]) => {
    setLetterSpacing(value[0]);
  };

  return (
    <div className={`${styles.container} ${className ?? ''}`}>
      <h3 className={styles.title}>Accessibility Settings</h3>
      
      <div className={styles.controlGroup}>
        <div className={styles.labelContainer}>
          <Text size={16} className={styles.icon} />
          <label htmlFor="font-size-slider">Font Size</label>
          <span className={styles.valueLabel}>{settings.fontSize}px</span>
        </div>
        <Slider
          id="font-size-slider"
          min={12}
          max={32}
          step={1}
          value={[settings.fontSize]}
          onValueChange={handleFontSizeChange}
          aria-label="Font size"
        />
      </div>

      <Separator className={styles.separator} />

      <div className={styles.controlGroup}>
        <div className={styles.labelContainer}>
          <Rows3 size={16} className={styles.icon} />
          <label htmlFor="line-height-slider">Line Height</label>
          <span className={styles.valueLabel}>{settings.lineHeight.toFixed(2)}</span>
        </div>
        <Slider
          id="line-height-slider"
          min={1.2}
          max={2.5}
          step={0.05}
          value={[settings.lineHeight]}
          onValueChange={handleLineHeightChange}
          aria-label="Line height"
        />
      </div>

      <div className={styles.controlGroup}>
        <div className={styles.labelContainer}>
          <CaseSensitive size={16} className={styles.icon} />
          <label htmlFor="letter-spacing-slider">Letter Spacing</label>
          <span className={styles.valueLabel}>{settings.letterSpacing.toFixed(2)}px</span>
        </div>
        <Slider
          id="letter-spacing-slider"
          min={0}
          max={5}
          step={0.1}
          value={[settings.letterSpacing]}
          onValueChange={handleLetterSpacingChange}
          aria-label="Letter spacing"
        />
      </div>

      <Separator className={styles.separator} />

      <div className={styles.toggleGroup}>
        <HighContrastToggle />
        <DyslexiaFontToggle />
      </div>

      <Separator className={styles.separator} />

      <div className={styles.controlGroup}>
        <div className={styles.labelContainer}>
          <Palette size={16} className={styles.icon} />
          <label>Color Theme</label>
        </div>
        <div className={styles.themeSelector}>
          <button
            className={`${styles.themeButton} ${settings.colorTheme === 'default' ? styles.active : ''}`}
            onClick={() => setColorTheme('default')}
            aria-pressed={settings.colorTheme === 'default'}
            style={{'--bg': 'var(--background)', '--fg': 'var(--foreground)'} as React.CSSProperties}
          >
            Default
          </button>
          <button
            className={`${styles.themeButton} ${settings.colorTheme === 'light' ? styles.active : ''}`}
            onClick={() => setColorTheme('light')}
            aria-pressed={settings.colorTheme === 'light'}
            style={{'--bg': '#FFFFFF', '--fg': '#000000'} as React.CSSProperties}
          >
            Light
          </button>
          <button
            className={`${styles.themeButton} ${settings.colorTheme === 'dark' ? styles.active : ''}`}
            onClick={() => setColorTheme('dark')}
            aria-pressed={settings.colorTheme === 'dark'}
            style={{'--bg': '#000000', '--fg': '#FFFFFF'} as React.CSSProperties}
          >
            Dark
          </button>
          <button
            className={`${styles.themeButton} ${settings.colorTheme === 'sepia' ? styles.active : ''}`}
            onClick={() => setColorTheme('sepia')}
            aria-pressed={settings.colorTheme === 'sepia'}
            style={{'--bg': '#FBF0D9', '--fg': '#5B4636'} as React.CSSProperties}
          >
            Sepia
          </button>
        </div>
      </div>
    </div>
  );
};