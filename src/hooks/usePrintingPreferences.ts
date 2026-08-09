import { useState, useEffect } from 'react';

interface PrintingPreferences {
  template: 'classic' | 'modern' | 'thermal' | 'minimal';
  paperSize: 'A4' | 'A5' | 'Letter' | 'Thermal';
  colorMode: 'color' | 'grayscale';
  includeHeaders: boolean;
  includeFooters: boolean;
  defaultCopies: number;
  autoDownload: boolean;
  showPreview: boolean;
  filenamePattern: string;
  compressionLevel: 'low' | 'medium' | 'high';
  watermark: boolean;
  watermarkText: string;
}

const DEFAULT_PREFERENCES: PrintingPreferences = {
  template: 'classic',
  paperSize: 'A4',
  colorMode: 'color',
  includeHeaders: true,
  includeFooters: true,
  defaultCopies: 1,
  autoDownload: true,
  showPreview: false,
  filenamePattern: 'invoice-{number}',
  compressionLevel: 'medium',
  watermark: false,
  watermarkText: 'COPY',
};

const STORAGE_KEY = 'printing_preferences';

export const usePrintingPreferences = () => {
  const [preferences, setPreferences] = useState<PrintingPreferences>(DEFAULT_PREFERENCES);
  const [loading, setLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPreferences = JSON.parse(stored);
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsedPreferences });
      }
    } catch (error) {
      console.error('Error loading printing preferences:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save preferences to localStorage
  const updatePreferences = (updates: Partial<PrintingPreferences>) => {
    const newPreferences = { ...preferences, ...updates };
    setPreferences(newPreferences);
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newPreferences));
    } catch (error) {
      console.error('Error saving printing preferences:', error);
    }
  };

  // Reset to defaults
  const resetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error resetting printing preferences:', error);
    }
  };

  // Get preference for specific template
  const getTemplatePreferences = (template: string) => {
    const templateKey = `${STORAGE_KEY}_${template}`;
    try {
      const stored = localStorage.getItem(templateKey);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error loading template preferences:', error);
      return null;
    }
  };

  // Save preference for specific template
  const saveTemplatePreferences = (template: string, prefs: Partial<PrintingPreferences>) => {
    const templateKey = `${STORAGE_KEY}_${template}`;
    try {
      localStorage.setItem(templateKey, JSON.stringify(prefs));
    } catch (error) {
      console.error('Error saving template preferences:', error);
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    resetPreferences,
    getTemplatePreferences,
    saveTemplatePreferences,
  };
};