import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { CUSTOM_CSS_KEY, WIDE_COMPACT_CSS, customStylesheet } from "./css";

export interface CssStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const browserStorage: CssStorage = {
  getItem: (key) => (typeof window === "undefined" ? null : window.localStorage.getItem(key)),
  setItem: (key, value) => window.localStorage.setItem(key, value),
};

interface CssSettings {
  css: string;
  save: (css: string) => void;
}
const CssContext = createContext<CssSettings | null>(null);

export function CustomCssProvider({
  children,
  storage = browserStorage,
}: {
  children: ReactNode;
  storage?: CssStorage;
}) {
  const [css, setCss] = useState(() => {
    try {
      return storage.getItem(CUSTOM_CSS_KEY) ?? WIDE_COMPACT_CSS;
    } catch {
      // Storage may be disabled. Keep the app usable; saving reports the failure in settings.
      return WIDE_COMPACT_CSS;
    }
  });
  useLayoutEffect(() => {
    const style = document.createElement("style");
    style.id = "paseo-custom-css";
    style.textContent = customStylesheet(css);
    document.head.appendChild(style);
    return () => style.remove();
  }, [css]);

  useEffect(() => {
    if (storage !== browserStorage) return;
    const sync = (event: StorageEvent) => {
      if (
        event.storageArea === window.localStorage &&
        (event.key === CUSTOM_CSS_KEY || event.key === null)
      ) {
        setCss(event.newValue ?? WIDE_COMPACT_CSS);
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [storage]);

  const value = useMemo(
    () => ({
      css,
      save(next: string) {
        storage.setItem(CUSTOM_CSS_KEY, next);
        setCss(next);
      },
    }),
    [css, storage],
  );
  return <CssContext.Provider value={value}>{children}</CssContext.Provider>;
}

export function useCustomCss() {
  const value = useContext(CssContext);
  if (!value) throw new Error("Custom CSS settings require CustomCssProvider");
  return value;
}
