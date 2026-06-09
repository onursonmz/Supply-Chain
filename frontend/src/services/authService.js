import { api } from './api'

export const authService = {
  login: (username, password) =>
    api.post('/api/auth/login', { username, password }),

  logout: () =>
    api.post('/api/auth/logout'),

  me: () =>
    api.get('/api/auth/me'),

  nodeInfo: () =>
    api.get('/api/auth/node-info'),
}
