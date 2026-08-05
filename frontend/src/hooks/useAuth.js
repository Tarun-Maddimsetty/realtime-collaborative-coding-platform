import { useState, useCallback } from 'react';
import api from '../services/api';
import { setToken, setUser, removeToken, removeUser, getUser, isAuthenticated } from '../utils/auth';

export const useAuth = () => {
  const [user, setUserState]   = useState(getUser);
  const [loading, setLoading]  = useState(false);
  const [error, setError]      = useState(null);

  const register = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/auth/register', data);
      setToken(res.data.token); setUser(res.data.user); setUserState(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed'); throw err;
    } finally { setLoading(false); }
  }, []);

  const login = useCallback(async (data) => {
    setLoading(true); setError(null);
    try {
      const res = await api.post('/auth/login', data);
      setToken(res.data.token); setUser(res.data.user); setUserState(res.data.user);
      return res.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed'); throw err;
    } finally { setLoading(false); }
  }, []);

  const logout = useCallback(() => {
    removeToken(); removeUser(); setUserState(null);
  }, []);

  return { user, loading, error, register, login, logout, isAuthenticated: isAuthenticated() };
};
