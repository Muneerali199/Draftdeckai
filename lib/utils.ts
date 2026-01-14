import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs));
}

/**
 * Sanitize a string for use as a filename
 * @param text The text to sanitize (e.g., subject line)
 * @param fallback Fallback string if text is empty
 * @returns Sanitized filename string
 */
export function sanitizeFilename(text: string | undefined | null, fallback: string): string {
  return text
    ? text.slice(0, 40).replace(/[^a-z0-9]/gi, '_').replace(/_+/g, '_')
    : fallback;
}
