import { api } from './api'

const BASE = '/api/cold-chain'

export const coldChainService = {
  submit:       (transferRequestId, data) => api.post(`${BASE}/${transferRequestId}`, data),
  getByTransfer:(transferRequestId)       => api.get(`${BASE}/${transferRequestId}`),
  getViolations:()                        => api.get(`${BASE}/violations`),
  getAll:       ()                        => api.get(BASE),
}
