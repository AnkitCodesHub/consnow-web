import { useAuth } from './hooks/useAuth';
import AuthPage from './components/AuthPage';
import Home from './components/Home';

export default function App() {
  const { token } = useAuth();
  return token ? <Home /> : <AuthPage />;
}
