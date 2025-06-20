
import * as React from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = React.createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "urbana-theme",
  ...props
}: ThemeProviderProps) {
  // Initialize theme with a more robust approach
  const [theme, setTheme] = React.useState<Theme>(() => {
    // Check if we're in a browser environment
    if (typeof window === "undefined") {
      return defaultTheme;
    }
    
    // Safely access localStorage
    try {
      const storedTheme = window.localStorage.getItem(storageKey);
      return (storedTheme as Theme) || defaultTheme;
    } catch (error) {
      console.warn("Failed to access localStorage:", error);
      return defaultTheme;
    }
  });

  React.useEffect(() => {
    const root = window.document.documentElement;
    
    root.classList.remove("light", "dark");
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
        
      root.classList.add(systemTheme);
      return;
    }
    
    root.classList.add(theme);
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      // Safely set localStorage
      try {
        if (typeof window !== "undefined") {
          window.localStorage.setItem(storageKey, theme);
        }
      } catch (error) {
        console.warn("Failed to save theme to localStorage:", error);
      }
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeProviderContext);
  
  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");
    
  return context;
};
