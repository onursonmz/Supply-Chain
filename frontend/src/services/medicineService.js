import { api } from './api'

export const medicineService = {
  getAll:           ()     => api.get('/api/medicines'),
  getById:          (id)   => api.get(`/api/medicines/${id}`),
  getBySerial:      (sn)   => api.get(`/api/medicines/serial/${sn}`),
  getHistory:       (id)   => api.get(`/api/transfers/history/${id}`),
  createBatch:      (data) => api.post('/api/medicines/batches', data),
  transfer:         (data) => api.post('/api/transfers', data),
  dispense:         (data) => api.post('/api/medicines/dispense', data),
  recallMedicine:   (id)   => api.post(`/api/medicines/${id}/recall`, {}),
  recallBatch:      (batchNumber) => api.post('/api/medicines/recall-batch', { batchNumber }),
  getOrganizations: (type) => api.get(`/api/organizations${type ? `?type=${type}` : ''}`),
  getInventory:     ()     => api.get('/api/medicines/inventory'),
  getDashboard:     ()     => api.get('/api/dashboard'),
  getAuditAll:      ()     => api.get('/api/audit/medicines'),
  getAuditById:     (id)   => api.get(`/api/audit/medicines/${id}`),
  getEvents:        (id)   => api.get(`/api/medicines/${id}/events`),
  getAllEvents:      ()     => api.get('/api/transfers/events'),
  verify:           (query)=> api.get(`/api/medicines/serial/${encodeURIComponent(query)}`),
}
