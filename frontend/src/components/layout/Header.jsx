import { useEffect, useRef, useState } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/useAdmin';

export const Header = () => {
  const navigate = useNavigate();
  const { currentUser, session, logout } = useAdmin();
  const [showUserInfo, setShowUserInfo] = useState(false);
  const userMenuRef = useRef(null);

  // El recuadro se cierra al tocar fuera de él o con Escape
  useEffect(() => {
    if (!showUserInfo) return undefined;
    const handlePointerDown = (event) => {
      if (!userMenuRef.current?.contains(event.target)) setShowUserInfo(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setShowUserInfo(false);
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showUserInfo]);

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
          <div className="header-user-menu" ref={userMenuRef}>
            <button
              type="button"
              className="header-user-avatar"
              aria-label={`Ver datos de ${currentUser.name}`}
              aria-expanded={showUserInfo}
              aria-controls="header-user-info"
              onClick={() => setShowUserInfo((open) => !open)}
            >
              <span aria-hidden="true">{currentUser.avatar}</span>
            </button>
            {showUserInfo && (
              <div id="header-user-info" className="header-user-popover" role="dialog" aria-label="Usuario logueado">
                <p className="header-user-popover-name">{currentUser.name}</p>
                <p className="header-user-popover-email">{currentUser.email}</p>
              </div>
            )}
          </div>
        )}
        {session && (
          <button className="logout-button" onClick={handleLogout}>
            <LogOut size={14} /> Cerrar sesión
          </button>
        )}
      </div>
    </header>
  );
};
