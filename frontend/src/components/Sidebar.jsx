import { NavLink } from 'react-router-dom';
import {
  Home,
  PlusSquare,
  DoorOpen,
  FolderOpen,
  Clock3,
  UserRound,
  Settings,
} from 'lucide-react';

const navItems = [
  { label: 'Home', to: '/dashboard', icon: Home },
  { label: 'Rooms', to: '/rooms', icon: DoorOpen },
  { label: 'Create Room', to: '/create-room', icon: PlusSquare },
  { label: 'Join Room', to: '/join-room', icon: DoorOpen },
  { label: 'Saved Files', to: '/saved-files', icon: FolderOpen },
  { label: 'Recent Rooms', to: '/recent-rooms', icon: Clock3 },
  { label: 'Profile', to: '/profile', icon: UserRound },
  { label: 'Settings', to: '/settings', icon: Settings },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        background: 'rgba(13,17,23,0.7)',
        borderRight: '1px solid rgba(48,54,61,0.8)',
        backdropFilter: 'blur(18px)',
        padding: '20px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 8px 18px' }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 10px 24px rgba(99, 102, 241, 0.35)',
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 700 }}>C</span>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>CodeCollab</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Workspace</div>
        </div>
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            end={to === '/dashboard'}
            style={({ isActive }) => ({
              textDecoration: 'none',
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              background: isActive ? 'rgba(99,102,241,0.12)' : 'transparent',
              border: isActive ? '1px solid rgba(99,102,241,0.28)' : '1px solid transparent',
              borderRadius: 12,
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontWeight: isActive ? 600 : 500,
              transition: 'all 0.18s ease',
            })}
          >
            <Icon size={17} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
