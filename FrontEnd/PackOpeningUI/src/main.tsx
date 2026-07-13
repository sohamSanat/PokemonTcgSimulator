
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import "./styles/index.css";

  import { AuthProvider } from './app/context/AuthContext';
  import { ErrorBoundary } from './app/components/ErrorBoundary';

  createRoot(document.getElementById("root")!).render(
    <ErrorBoundary>
    <AuthProvider>
      <App />
    </AuthProvider>
    </ErrorBoundary>
  );
  