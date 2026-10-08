import { Sun, Moon, LogOut } from 'lucide-react';
import { useAdmin } from '../../context/useAdmin';

export const Header = () => {
  const { theme, toggleTheme, currentUser, session, logout } = useAdmin();

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
        <button 
          className="theme-toggle-btn" 
          onClick={toggleTheme} 
          title={`Cambiar a modo ${theme === 'light' ? 'oscuro' : 'claro'}`}
          aria-label="Toggle Theme"
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        {session && <button className="logout-button" onClick={logout}><LogOut size={14} /> Cerrar sesión</button>}
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
