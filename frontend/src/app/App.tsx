import { RouterProvider } from 'react-router';
import { Toaster } from 'sonner';
import { router } from './routes';
import { DataProvider } from './context/DataContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from '../i18n/LanguageContext';
import { ConfirmDeleteProvider } from './context/ConfirmDeleteContext';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <ConfirmDeleteProvider>
        <AuthProvider>
          <DataProvider>
            <Toaster position="top-right" richColors />
            <RouterProvider router={router} />
          </DataProvider>
        </AuthProvider>
        </ConfirmDeleteProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
