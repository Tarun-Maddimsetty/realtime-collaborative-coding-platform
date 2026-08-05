import api from './api';

export const getRooms = (search = '', visibility = 'all') => api.get('/rooms', { params: { search, visibility, all: visibility === 'all' } });
export const getPublicRooms = (search = '') => api.get('/rooms', { params: { search, visibility: 'public' } });
export const getPrivateRooms = (search = '') => api.get('/rooms', { params: { search, visibility: 'private' } });
export const getActiveRooms = (search = '') => api.get('/rooms', { params: { search, visibility: 'all', all: true } });
export const getRoomById = (roomId) => api.get(`/rooms/${roomId}`);
export const createRoom = (data) => api.post('/rooms', data);
export const joinRoom = (roomId) => api.post(`/rooms/${roomId}/join`);
export const joinRoomByCode = (data) => api.post('/rooms/join-by-code', data);
export const leaveRoom = (roomId) => api.post(`/rooms/${roomId}/leave`);
export const deleteRoom = (roomId) => api.delete(`/rooms/${roomId}`);
export const saveCode = (roomId, data) => api.put(`/rooms/${roomId}/code`, data);
export const getParticipants = (roomId) => api.get(`/rooms/${roomId}/participants`);

export const getUserFiles = () => api.get('/rooms/files/me');
export const getSavedFiles = () => api.get('/files');
export const getSavedFileById = (id) => api.get(`/files/${id}`);
export const saveFile = (data) => api.post('/files/save', data);

export const listFiles = (roomId) => api.get(`/rooms/${roomId}/files`);
export const createFile = (roomId, data) => api.post(`/rooms/${roomId}/files`, data);
export const updateFile = (roomId, fileId, data) => api.put(`/rooms/${roomId}/files/${fileId}`, data);
export const deleteFile = (roomId, fileId) => api.delete(`/rooms/${roomId}/files/${fileId}`);
export const deleteSavedFile = (fileId) => api.delete(`/files/${fileId}`);
