import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

const client = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Police LEA GIS Hotspots with Drill-Down Filters
  getHotspots: (params = {}) => client.get('/hotspots/', { params }),

  // I4C National Macro Overview
  getDashboardSummary: () => client.get('/dashboard/summary/'),

  // Bank FRM Desk
  getBankMules: () => client.get('/mules/'),
  placeLien: (accountId) => client.post(`/mules/${accountId}/lien/`),
  fastLienCase: (complaintId) => client.post(`/complaints/${encodeURIComponent(complaintId)}/fast-lien/`),
  initiateRefund: (accountId) => client.post(`/incidents/${accountId}/refund/`),

  // Citizen Intake & Prediction Pipeline
  submitComplaint: (payload) => client.post('/complaints/submit/', payload),
  parseNlpComplaint: (text) => client.post('/complaints/nlp-parse/', { text }),

  // Citizen Case Status & Recovery Tracking (NCRP ID)
  getCaseStatus: (ncrpId, params = {}) => client.get(`/complaints/status/${encodeURIComponent(ncrpId)}/`, { params }),
  getCitizenCases: (params = {}) => client.get('/citizen/cases/', { params }),

  // Alert & Notification System (Deliverable d)
  getNotifications: (params = {}) => client.get('/notifications/', { params }),
  dispatchBeatAlert: (payload) => client.post('/notifications/beat-alert/', payload),

  // Authentication
  sendCitizenOtp: (mobile_number) => client.post('/auth/citizen/send-otp/', { mobile_number }),
  verifyCitizenOtp: (mobile_number, otp) => client.post('/auth/citizen/verify-otp/', { mobile_number, otp }),
  loginOfficial: (email, password) => client.post('/auth/official/login/', { email, password }),
};

export default api;