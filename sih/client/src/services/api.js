const BASE_URL = '/api';

export const api = {
  getToken() {
    return localStorage.getItem('cognicare_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('cognicare_token', token);
    } else {
      localStorage.removeItem('cognicare_token');
    }
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('cognicare_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem('cognicare_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('cognicare_user');
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }
      return data;
    } catch (err) {
      console.warn(`[API] Error calling ${endpoint}:`, err.message);
      throw err;
    }
  },

  // Auth Endpoints
  loginCaregiver(email, password) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  loginPatient(pin, name) {
    return this.request('/auth/patient-login', {
      method: 'POST',
      body: JSON.stringify({ pin, name }),
    });
  },

  getMe() {
    return this.request('/auth/me');
  },

  // Patients
  getPatients() {
    return this.request('/patients');
  },

  getPatient(id) {
    return this.request(`/patients/${id}`);
  },

  getPatientStats(id) {
    return this.request(`/patients/${id}/stats`);
  },

  getNextDifficulty(patientId, gameType) {
    return this.request(`/patients/${patientId}/next-difficulty/${gameType}`);
  },

  // Game Sessions
  saveGameSession(sessionData) {
    return this.request('/game-sessions', {
      method: 'POST',
      body: JSON.stringify(sessionData),
    });
  },

  getPatientSessions(patientId, gameType) {
    const q = gameType ? `?gameType=${gameType}` : '';
    return this.request(`/game-sessions/patient/${patientId}${q}`);
  },

  // Reminders
  getReminders(patientId) {
    return this.request(`/reminders/patient/${patientId}`);
  },

  createReminder(reminderData) {
    return this.request('/reminders', {
      method: 'POST',
      body: JSON.stringify(reminderData),
    });
  },

  acknowledgeReminder(id) {
    return this.request(`/reminders/${id}/acknowledge`, {
      method: 'POST',
      body: JSON.stringify({ acknowledgedAt: new Date().toISOString() }),
    });
  },

  // Dashboard
  getCaregiverDashboard() {
    return this.request('/dashboard/caregiver');
  },
};
