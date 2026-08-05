import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { isAuthenticated } from './utils/auth';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SavedFilesPage from './pages/SavedFilesPage';
import CreateRoomPage from './pages/CreateRoomPage';
import JoinRoomPage from './pages/JoinRoomPage';
import RecentRoomsPage from './pages/RecentRoomsPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import Room from './pages/Room';
import MembersPage from './pages/MembersPage';

const RoomsPage = () => <RecentRoomsPage />;
const PublicRoomsPage = () => <RecentRoomsPage filter="public" />;
const PrivateRoomsPage = () => <RecentRoomsPage filter="private" />;
const ActiveRoomsPage = () => <RecentRoomsPage filter="active" />;

const ProtectedRoute = ({ children }) =>
  isAuthenticated() ? children : <Navigate to="/login" replace />;

const PublicRoute = ({ children }) =>
  !isAuthenticated() ? children : <Navigate to="/dashboard" replace />;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/rooms" element={<ProtectedRoute><RoomsPage /></ProtectedRoute>} />
        <Route path="/public-rooms" element={<ProtectedRoute><PublicRoomsPage /></ProtectedRoute>} />
        <Route path="/private-rooms" element={<ProtectedRoute><PrivateRoomsPage /></ProtectedRoute>} />
        <Route path="/active-rooms" element={<ProtectedRoute><ActiveRoomsPage /></ProtectedRoute>} />
        <Route path="/create-room" element={<ProtectedRoute><CreateRoomPage /></ProtectedRoute>} />
        <Route path="/join-room" element={<ProtectedRoute><JoinRoomPage /></ProtectedRoute>} />
        <Route path="/saved-files" element={<ProtectedRoute><SavedFilesPage /></ProtectedRoute>} />
        <Route path="/recent-rooms" element={<ProtectedRoute><RecentRoomsPage /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/profile/:userId" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/room/:roomId" element={<ProtectedRoute><Room /></ProtectedRoute>} />
        <Route path="/room/:roomId/members" element={<ProtectedRoute><MembersPage /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}
