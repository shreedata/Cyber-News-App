import React from 'react';
import { createContext, useContext } from 'react';

const defaultTheme = {
  primary: '#121212',
  secondary: '#242424',
  accent: '#007AFF',
  text: '#FFFFFF',
  error: '#FF3B30',
};

const ThemeContext = createContext(defaultTheme);

export const ThemeProvider = ({ children }) => {
  return (
    <ThemeContext.Provider value={defaultTheme}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
