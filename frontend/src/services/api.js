import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const authService = {
  login: async (email, password) => {
    const formData = new URLSearchParams()
    formData.append('username', email)
    formData.append('password', password)
    const { data } = await api.post('/auth/login', formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return data
  },

  register: async (email, username, password, fullName, role, assignedClasses, roleCode) => {
    const body = { email, username, password, full_name: fullName }
    if (role) body.role = role
    if (assignedClasses) body.assigned_classes = assignedClasses
    if (roleCode) body.role_code = roleCode
    const { data } = await api.post('/auth/register', body)
    return data
  },

  getMe: async () => {
    const { data } = await api.get('/auth/me')
    return data
  },

  updateConsent: async (consent) => {
    const { data } = await api.put('/auth/consent', { consent_given: consent })
    return data
  },

  listUsers: async () => {
    const { data } = await api.get('/auth/users')
    return data
  },

  updateUserRole: async (userId, role, assignedClasses) => {
    const { data } = await api.put(`/auth/users/${userId}/role`, {
      role,
      assigned_classes: assignedClasses,
    })
    return data
  },
}

export const analysisService = {
  analyze: async (requestData) => {
    const { data } = await api.post('/analysis/', requestData)
    return data
  },

  getHistory: async () => {
    const { data } = await api.get('/analysis/history')
    return data
  },

  getResult: async (id) => {
    const { data } = await api.get(`/analysis/${id}`)
    return data
  },

  deleteResult: async (id) => {
    const { data } = await api.delete(`/analysis/${id}`)
    return data
  },
}

export const reportsService = {
  getAssignedStudents: async () => {
    const { data } = await api.get('/reports/psychologist/students')
    return data
  },

  getStudentLatest: async (studentId) => {
    const { data } = await api.get(`/reports/psychologist/students/${studentId}/latest`)
    return data
  },

  getGroupSummary: async () => {
    const { data } = await api.get('/reports/curator/group-summary')
    return data
  },

  getAllResultsAdmin: async () => {
    const { data } = await api.get('/reports/admin/all-results')
    return data
  },

  getAuditLogs: async () => {
    const { data } = await api.get('/reports/admin/logs')
    return data
  },

  createScenario: async (userId, scenario) => {
    const { data } = await api.post('/reports/admin/scenarios', { user_id: userId, scenario })
    return data
  },
}

export const profileService = {
  create: async (profileData) => {
    const { data } = await api.post('/profiles/', profileData)
    return data
  },

  list: async () => {
    const { data } = await api.get('/profiles/')
    return data
  },

  delete: async (id) => {
    const { data } = await api.delete(`/profiles/${id}`)
    return data
  },
}

export const contactService = {
  submit: async (formData) => {
    const { data } = await api.post('/contact/', formData)
    return data
  },
}

export default api
