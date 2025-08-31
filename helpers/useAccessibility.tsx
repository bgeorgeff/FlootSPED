import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ColorTheme = 'default' | 'light' | 'dark' | 'sepia';

export interface AccessibilitySettings {
  fontSize: number;
  isHighContrast: boolean;
  isDyslexiaFont: boolean;
  lineHeight: number;
  letterSpacing: number;
  colorTheme: ColorTheme;
}

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  setFontSize: (size: number) => void;
  toggleHighContrast: () => void;
  toggleDyslexiaFont: () => void;
  setLineHeight: (height: number) => void;
  setLetterSpacing: (spacing: number) => void;
  setColorTheme: (theme: ColorTheme) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: AccessibilitySettings = {
  fontSize: 16,
  isHighContrast: false,
  isDyslexiaFont: false,
  lineHeight: 1.5,
  letterSpacing: 0.5,
  colorTheme: 'default',
};

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

const getInitialState = (): AccessibilitySettings => {
  try {
    const item = window.localStorage.getItem('accessibility-settings');
    return item ? { ...DEFAULT_SETTINGS, ...JSON.parse(item) } : DEFAULT_SETTINGS;
  } catch (error) {
    console.error('Error reading accessibility settings from localStorage', error);
    return DEFAULT_SETTINGS;
  }
};

export const AccessibilityProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AccessibilitySettings>(getInitialState);

  useEffect(() => {
    try {
      window.localStorage.setItem('accessibility-settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving accessibility settings to localStorage', error);
    }

    const root = document.documentElement;
    root.style.setProperty('--a11y-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--a11y-line-height', String(settings.lineHeight));
    root.style.setProperty('--a11y-letter-spacing', `${settings.letterSpacing}px`);
    
    if (settings.isDyslexiaFont) {
      root.classList.add('dyslexia-font');
    } else {
      root.classList.remove('dyslexia-font');
    }

    if (settings.isHighContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    root.setAttribute('data-color-theme', settings.colorTheme);

  }, [settings]);

  const setFontSize = useCallback((size: number) => {
    setSettings(s => ({ ...s, fontSize: size }));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setSettings(s => ({ ...s, isHighContrast: !s.isHighContrast }));
  }, []);

  const toggleDyslexiaFont = useCallback(() => {
    setSettings(s => ({ ...s, isDyslexiaFont: !s.isDyslexiaFont }));
  }, []);

  const setLineHeight = useCallback((height: number) => {
    setSettings(s => ({ ...s, lineHeight: height }));
  }, []);

  const setLetterSpacing = useCallback((spacing: number) => {
    setSettings(s => ({ ...s, letterSpacing: spacing }));
  }, []);

  const setColorTheme = useCallback((theme: ColorTheme) => {
    setSettings(s => ({ ...s, colorTheme: theme }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
  }, []);

  const value = {
    settings,
    setFontSize,
    toggleHighContrast,
    toggleDyslexiaFont,
    setLineHeight,
    setLetterSpacing,
    setColorTheme,
    resetSettings,
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
};

export const useAccessibility = (): AccessibilityContextType => {
  const context = useContext(AccessibilityContext);
  if (context === undefined) {
    throw new Error('useAccessibility must be used within an AccessibilityProvider');
  }
  return context;
};