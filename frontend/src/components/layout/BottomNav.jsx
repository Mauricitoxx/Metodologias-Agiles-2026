import React from 'react';
import { Dices, ShieldCheck } from 'lucide-react';
import { useAdmin } from '../../context/useAdmin';

export const BottomNav = () => {
  const { currentTab, setCurrentTab, data } = useAdmin();

  const navItems = [
    {
      id: 'catalogo',
      label: 'Catálogo',
      icon: Dices,
      count: (data.boardgames?.length || 0) + (data.comics?.length || 0) + (data.cards?.length || 0)
    },
    {
      id: 'staff',
      label: 'Staff',
      icon: ShieldCheck,
      count: data.admins?.length || 0
    }
  ];

  return (
    <nav className="bottom-nav-bar bottom-nav-2-items" aria-label="Navegación principal">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentTab === item.id || (item.id === 'staff' && currentTab === 'admin');
        return (
          <button
            key={item.id}
            className={`bottom-nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setCurrentTab(item.id)}
            aria-selected={isActive}
          >
            <div className="nav-icon-wrapper">
              <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              {item.count > 0 && <span className="nav-mini-badge">{item.count}</span>}
            </div>
            <span className="nav-item-label">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
