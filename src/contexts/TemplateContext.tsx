"use client";
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { TemplateType } from '@/app/invoices/components/TemplateSwitcher';
import { getTemplatePreference, saveTemplatePreference } from '../utils/templatePreferences';

interface TemplateContextType {
  template: TemplateType;
  setTemplate: (template: TemplateType) => void;
}

const TemplateContext = createContext<TemplateContextType | undefined>(undefined);

export const TemplateProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [template, setTemplateState] = useState<TemplateType>('modern');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Load saved preference on initial render
  useEffect(() => {
    if (typeof window !== 'undefined' && !isInitialized) {
      try {
        const savedTemplate = getTemplatePreference();
        console.log('TemplateContext: Loading saved template:', savedTemplate);
        setTemplateState(savedTemplate);
        setIsInitialized(true);
      } catch (error) {
        console.error('Error loading template preference:', error);
      }
    }
  }, [isInitialized]);
  
  // Save preference when it changes
  const setTemplate = (newTemplate: TemplateType) => {
    console.log('TemplateContext: Setting template to:', newTemplate);
    setTemplateState(newTemplate);
    saveTemplatePreference(newTemplate);
  };
  
  return (
    <TemplateContext.Provider value={{ template, setTemplate }}>
      {children}
    </TemplateContext.Provider>
  );
};

export const useTemplate = (): TemplateContextType => {
  const context = useContext(TemplateContext);
  if (context === undefined) {
    throw new Error('useTemplate must be used within a TemplateProvider');
  }
  return context;
};