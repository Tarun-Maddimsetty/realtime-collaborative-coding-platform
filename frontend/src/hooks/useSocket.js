import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { getToken } from '../utils/auth';

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
    // Guard: don't create a second socket if StrictMode already made one
    if (socketRef.current?.connected) return;

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      auth: { token: getToken() },
      // Start with polling so the HTTP upgrade handshake can complete,
      // then Socket.IO automatically upgrades to WebSocket.
      // Using ['websocket'] alone skips the handshake and causes
      // "WebSocket closed before connection established".
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  return socketRef;
};
