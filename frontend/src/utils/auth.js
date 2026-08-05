export const getToken  = ()        => localStorage.getItem('token');
export const setToken  = (token)   => localStorage.setItem('token', token);
export const removeToken = ()      => localStorage.removeItem('token');
export const getUser = () => {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return null;
  try {
    const parsedUser = JSON.parse(storedUser);
    return parsedUser ? { ...parsedUser, _id: parsedUser._id || parsedUser.id } : null;
  } catch {
    return null;
  }
};
export const setUser = (user) => {
  if (!user) {
    localStorage.removeItem('user');
    return;
  }
  const normalizedUser = { ...user, _id: user._id || user.id };
  localStorage.setItem('user', JSON.stringify(normalizedUser));
};
export const removeUser = ()       => localStorage.removeItem('user');
export const isAuthenticated = ()  => !!getToken();
