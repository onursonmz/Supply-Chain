import { api } from './api'

const BASE = '/api/transfer-requests'

export const transferRequestService = {
  // Direct transfer: creates + dispatches in one step (recommended)
  transferDirect:      (data)           => api.post(`${BASE}/direct`, data),
  // Legacy two-step flow (kept for OutgoingTransfersPage)
  create:              (data)           => api.post(BASE, data),
  dispatch:            (id)             => api.post(`${BASE}/${id}/dispatch`, {}),
  cancel:              (id)             => api.post(`${BASE}/${id}/cancel`, {}),
  accept:              (id)             => api.post(`${BASE}/${id}/accept`, {}),
  reject:              (id, reason)     => api.post(`${BASE}/${id}/reject`, { reason }),
  getOutgoing:         ()               => api.get(`${BASE}/outgoing`),
  getIncoming:         ()               => api.get(`${BASE}/incoming`),
  getPendingAcceptance:()               => api.get(`${BASE}/pending-acceptance`),
  getAll:              ()               => api.get(BASE),
  getBatchSummaries:   ()               => api.get('/api/medicines/batches/summary'),
}
