import { useAuth } from './hooks/useAuth';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

export default function App() {
  const { token } = useAuth();
  return token ? <Dashboard /> : <AuthPage />;
}
