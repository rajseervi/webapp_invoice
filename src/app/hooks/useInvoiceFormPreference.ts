import { useState, useEffect } from 'react';

const PREFERENCE_KEY = 'invoice-form-preference';

export function useInvoiceFormPreference() {
  const [useMergedForm, setUseMergedForm] = useState(true); // Default to merged form
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Load preference from localStorage on mount
    const savedPreference = localStorage.getItem(PREFERENCE_KEY);
    if (savedPreference !== null) {
      setUseMergedForm(savedPreference === 'merged');
    }
    setIsLoaded(true);
  }, []);

  const updatePreference = (merged: boolean) => {
    setUseMergedForm(merged);
    localStorage.setItem(PREFERENCE_KEY, merged ? 'merged' : 'tabbed');
  };

  return {
    useMergedForm,
    setUseMergedForm: updatePreference,
    isLoaded
  };
}