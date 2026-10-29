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

        {session && (
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        )}
        <div className="user-avatar-wrapper" title={`${currentUser.name} (${currentUser.role})`}>
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="user-avatar-img"
          />
          <span className="user-status-dot" />
        </div>
      </div>
    </header>
  );
};
