import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Initial state
const initialState = {
  theme: 'light', // 'light' or 'dark'
  systemPreference: 'light'
};

// Action types
const THEME_ACTIONS = {
  SET_THEME: 'SET_THEME',
  TOGGLE_THEME: 'TOGGLE_THEME',
  SET_SYSTEM_PREFERENCE: 'SET_SYSTEM_PREFERENCE'
};

// Reducer
const themeReducer = (state, action) => {
  switch (action.type) {
    case THEME_ACTIONS.SET_THEME:
      return {
        ...state,
        theme: action.payload
      };
    
    case THEME_ACTIONS.TOGGLE_THEME:
      return {
        ...state,
        theme: state.theme === 'light' ? 'dark' : 'light'
      };
    
    case THEME_ACTIONS.SET_SYSTEM_PREFERENCE:
      return {
        ...state,
        systemPreference: action.payload
      };
    
    default:
      return state;
  }
};

// Create context
const ThemeContext = createContext();

// Theme Provider Component
export const ThemeProvider = ({ children }) => {
  const [state, dispatch] = useReducer(themeReducer, initialState);

  // Load theme from localStorage on app start
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const systemPreference = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    
    dispatch({
      type: THEME_ACTIONS.SET_SYSTEM_PREFERENCE,
      payload: systemPreference
    });

    if (savedTheme) {
      dispatch({
        type: THEME_ACTIONS.SET_THEME,
        payload: savedTheme
      });
    } else {
      // Use system preference if no saved theme
      dispatch({
        type: THEME_ACTIONS.SET_THEME,
        payload: systemPreference
      });
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      const systemPreference = e.matches ? 'dark' : 'light';
      dispatch({
        type: THEME_ACTIONS.SET_SYSTEM_PREFERENCE,
        payload: systemPreference
      });
      
      // If no saved theme, follow system preference
      if (!localStorage.getItem('theme')) {
        dispatch({
          type: THEME_ACTIONS.SET_THEME,
          payload: systemPreference
        });
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
    document.documentElement.className = state.theme;
  }, [state.theme]);

  // Set theme function
  const setTheme = (theme) => {
    dispatch({
      type: THEME_ACTIONS.SET_THEME,
      payload: theme
    });
    localStorage.setItem('theme', theme);
  };

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = state.theme === 'light' ? 'dark' : 'light';
    dispatch({
      type: THEME_ACTIONS.TOGGLE_THEME
    });
    localStorage.setItem('theme', newTheme);
  };

  // Reset to system preference
  const resetToSystem = () => {
    dispatch({
      type: THEME_ACTIONS.SET_THEME,
      payload: state.systemPreference
    });
    localStorage.removeItem('theme');
  };

  const value = {
    ...state,
    setTheme,
    toggleTheme,
    resetToSystem,
    isDark: state.theme === 'dark',
    isLight: state.theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme context
export const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default ThemeContext;