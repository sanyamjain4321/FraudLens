async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const token = localStorage.getItem('razorshield_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let errMessage = `API Error ${res.status}`;
    try {
      const data = await res.json();
      if (data.detail) errMessage = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      else if (data.error) errMessage = data.error;
    } catch (_) {
      const text = await res.text().catch(() => '');
      if (text) errMessage = text;
    }
    throw new Error(errMessage);
  }
  return res.json();
}

export const api = {
  health: () => apiFetch('/api/health'),
  auth: {
    signup: (data: any) => apiFetch('/api/auth/signup', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: any) => apiFetch('/api/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => apiFetch('/api/auth/me'),
    logout: () => {
      localStorage.removeItem('razorshield_token');
      localStorage.removeItem('razorshield_user');
      return apiFetch('/api/auth/logout', { method: 'POST' });
    }
  },
  dashboard: {
    summary: () => apiFetch('/api/dashboard/summary'),
  },
  transactions: {
    list: (params?: Record<string, string | number | boolean | undefined>) => {
      const filtered: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== '' && v !== null) filtered[k] = String(v);
        });
      }
      const qs = new URLSearchParams(filtered).toString();
      return apiFetch(`/api/transactions${qs ? '?' + qs : ''}`);
    },
    get: (id: string) => apiFetch(`/api/transactions/${id}`),
    decide: (id: string, action: string, reason = '') =>
      apiFetch(`/api/transactions/${id}/decision`, {
        method: 'POST',
        body: JSON.stringify({ action, reason }),
      }),
  },
  audit: {
    list: (params?: Record<string, string | number | undefined>) => {
      const filtered: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== '' && v !== null) filtered[k] = String(v);
        });
      }
      const qs = new URLSearchParams(filtered).toString();
      return apiFetch(`/api/audit${qs ? '?' + qs : ''}`);
    },
  },
  cases: {
    list: (params?: Record<string, string | number | undefined>) => {
      const filtered: Record<string, string> = {};
      if (params) {
        Object.entries(params).forEach(([k, v]) => {
          if (v !== undefined && v !== '' && v !== null) filtered[k] = String(v);
        });
      }
      const qs = new URLSearchParams(filtered).toString();
      return apiFetch(`/api/cases${qs ? '?' + qs : ''}`);
    },
  },
  analytics: {
    summary: () => apiFetch('/api/analytics/summary'),
  },
  model: {
    info: () => apiFetch('/api/model/info'),
  },
  simulator: {
    start: (rate: number, mode: string) =>
      apiFetch(`/api/simulator/start?rate=${rate}&mode=${encodeURIComponent(mode)}`, { method: 'POST' }),
    stop: () => apiFetch('/api/simulator/stop', { method: 'POST' }),
    inject: (threat_type: string) =>
      apiFetch(`/api/simulator/inject?threat_type=${encodeURIComponent(threat_type)}`, { method: 'POST' }),
    status: () => apiFetch('/api/simulator/status'),
  },
};
