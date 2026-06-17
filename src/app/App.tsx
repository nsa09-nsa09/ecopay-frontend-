import { RouterProvider } from "react-router";
import { Toaster } from "sonner";
import { ThemeProvider } from "./components/theme-provider";
import { I18nProvider } from "./components/i18n-provider";
import { AuthProvider } from "./components/auth/auth-provider";
import { NotificationsProvider } from "./components/notifications/notifications-provider";
import { router } from "./routes";

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <NotificationsProvider>
            <RouterProvider router={router} />
            <Toaster position="top-right" richColors closeButton />
          </NotificationsProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
