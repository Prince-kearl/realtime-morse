import { useEffect, useState } from 'react';

type Theme = 'dark' | 'light';

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved theme from localStorage or default to light
    const saved = localStorage.getItem('morse-theme');
    const initialTheme = (saved as Theme) || 'light';
    setTheme(initialTheme);
    
    // Apply theme to DOM
    applyTheme(initialTheme);
    setMounted(true);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    const html = document.documentElement;
    if (newTheme === 'dark') {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  };

  const updateTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('morse-theme', newTheme);
    applyTheme(newTheme);
  };

  return { theme, updateTheme, mounted };
}
