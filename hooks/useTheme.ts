import { useState, useEffect } from 'react';

export const useTheme = (): ['light' | 'dark', () => void] => {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // This function runs only on initial mount.
    if (typeof window === 'undefined') {
      return 'dark'; // Default for server-side rendering or non-browser envs
    }
    // Check localStorage first
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    // If no saved theme, check system preference
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  return [theme, toggleTheme];
};
