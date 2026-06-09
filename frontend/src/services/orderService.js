import { api } from './api'

const BASE = '/api/distributor-orders'

export const orderService = {
  create:       (data) => api.post(BASE, data),
  approve:      (id)   => api.post(`${BASE}/${id}/approve`, {}),
  reject:       (id, reason) => api.post(`${BASE}/${id}/reject`, { reason }),
  getMyOrders:  ()     => api.get(`${BASE}/my`),
  getIncoming:  ()     => api.get(`${BASE}/incoming`),
  getAll:       ()     => api.get(BASE),
}
