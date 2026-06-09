import { api } from './api'

export const organizationService = {
  // Public (auth-required) — accessible by all roles
  getActiveByType: (type) => api.get(`/api/organizations/active?type=${type}`),
  getAllActive:    ()      => api.get('/api/organizations/active'),
}

export const adminService = {
  // Organizations
  getOrganizations:      ()        => api.get('/api/admin/organizations'),
  getOrganization:       (id)      => api.get(`/api/admin/organizations/${id}`),
  createOrganization:    (data)    => api.post('/api/admin/organizations', data),
  updateOrganization:    (id, data)=> api.put(`/api/admin/organizations/${id}`, data),
  toggleOrganization:    (id)      => api.put(`/api/admin/organizations/${id}/toggle`, {}),

  // Users
  getUsers:   ()        => api.get('/api/admin/users'),
  getUser:    (id)      => api.get(`/api/admin/users/${id}`),
  createUser: (data)    => api.post('/api/admin/users', data),
  updateUser: (id, data)=> api.put(`/api/admin/users/${id}`, data),
  toggleUser: (id)      => api.put(`/api/admin/users/${id}/toggle`, {}),
}
