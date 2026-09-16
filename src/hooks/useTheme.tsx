import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Theme = "light" | "dark";
const Ctx = createContext<{ theme: Theme; toggle: () => void; setTheme: (t: Theme) => void }>({
  theme: "light",
  toggle: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored =
      (typeof window !== "undefined" && (localStorage.getItem("camvcc-theme") as Theme | null)) ||
      null;
    // Default to dark theme unless the user has explicitly chosen light before.
    const initial: Theme = stored ?? "dark";
    setThemeState(initial);
    document.documentElement.classList.toggle("dark", initial === "dark");
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    try {
      localStorage.setItem("camvcc-theme", t);
    } catch (_) {
      /* ignore */
    }
  };

  return (
    <Ctx.Provider
      value={{ theme, toggle: () => setTheme(theme === "dark" ? "light" : "dark"), setTheme }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useTheme = () => useContext(Ctx);
