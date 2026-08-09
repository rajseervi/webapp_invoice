import { TemplateType } from '@/app/invoices/components/TemplateSwitcher';

const TEMPLATE_PREFERENCE_KEY = 'invoice_template_preference';

/**
 * Saves the user's preferred invoice template to local storage
 * 
 * @param template - The template type to save
 */
export const saveTemplatePreference = (template: TemplateType): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TEMPLATE_PREFERENCE_KEY, template);
  }
};

/**
 * Gets the user's preferred invoice template from local storage
 * 
 * @returns The saved template type or 'modern' as default
 */
export const getTemplatePreference = (): TemplateType => {
  if (typeof window !== 'undefined') {
    const savedTemplate = localStorage.getItem(TEMPLATE_PREFERENCE_KEY);
    if (savedTemplate && ['modern', 'classic', 'minimalist'].includes(savedTemplate)) {
      return savedTemplate as TemplateType;
    }
  }
  return 'modern'; // Default template
};

/**
 * Clears the user's template preference from local storage
 */
export const clearTemplatePreference = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TEMPLATE_PREFERENCE_KEY);
  }
};