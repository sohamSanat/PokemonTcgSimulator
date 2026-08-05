  import { createRoot } from "react-dom/client";
  import { Analytics } from "@vercel/analytics/react";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  import { AuthProvider } from './app/context/AuthContext';
  import { EconomyProvider } from './app/context/EconomyContext';
  import { AppUIProvider } from './app/context/AppUIContext';
  import { ErrorBoundary } from './app/components/ErrorBoundary';

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
      <AuthProvider>
        <EconomyProvider>
          <AppUIProvider>
            <App />
            <Analytics />
          </AppUIProvider>
        </EconomyProvider>
      </AuthProvider>
    </ErrorBoundary>
  );