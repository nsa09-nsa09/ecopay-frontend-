import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/theme-provider";
import { I18nProvider } from "./components/i18n-provider";
import { AuthProvider } from "./components/auth/auth-provider";
import { router } from "./routes";

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors closeButton />
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
