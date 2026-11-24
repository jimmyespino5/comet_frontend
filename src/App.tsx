import { useState } from "react"
import { Dashboard } from "./pages/Dashboard"
import { useAuthStore } from './store/useAuthStore';
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"

function App() {
  // Nos suscribimos al estado isAuthenticated de Zustand
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const [showRegister, setShowRegister] = useState(false);

  if (isAuthenticated) return <Dashboard />;

  return showRegister
    ? <Register onBackToLogin={() => setShowRegister(false)} />
    : <Login onShowRegister={() => setShowRegister(true)} />;
}

export default App
