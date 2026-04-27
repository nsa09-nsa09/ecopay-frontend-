import { Outlet } from "react-router";
import { ThemeProvider } from "./theme-provider";
import { I18nProvider } from "./i18n-provider";

export function RootLayout() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <Outlet />
      </I18nProvider>
    </ThemeProvider>
  );
}
