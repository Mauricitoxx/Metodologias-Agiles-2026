import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/useAdmin';

export const Header = () => {
  const navigate = useNavigate();
  const { currentUser, session, logout } = useAdmin();

  const handleLogout = async () => {
    if (await logout()) navigate('/login');
  };

  return (
    <header className="app-header">
      <div className="brand-block">
        <div className="brand-logo-icon">
          <span className="logo-emoji">🎲</span>
        </div>
        <div className="brand-titles">
          <h1 className="brand-name">LA FRIKIOTECA</h1>
          <p className="brand-tagline">COMIC • BUFFET • GAMES</p>
        </div>
      </div>

      <div className="header-actions">
        {currentUser && (
          <span className="header-user-name" title={currentUser.email}>
            {currentUser.name}
          </span>
        )}
        {session && (
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        )}
        {currentUser && (
          <span className="header-user-avatar" role="img" aria-label={`Avatar de ${currentUser.name}`}>
            {currentUser.avatar}
          </span>
        )}
      </div>
    </header>
  );
};
