import api from './api';

export const executeCode = (payload = {}) => {
  const safePayload = {
    ...payload,
    input: typeof payload.input === 'string' ? payload.input : (typeof payload.stdin === 'string' ? payload.stdin : ''),
    stdin: typeof payload.input === 'string' ? payload.input : (typeof payload.stdin === 'string' ? payload.stdin : ''),
    sessionId: payload.sessionId || null,
  };

  return api.post('/execute', safePayload);
};
