const API_BASE = '/api/applications';

export class ApplicationApi {
  static async getApplications(status = null) {
    const url = status && status !== 'all' ? `${API_BASE}?status=${status}` : API_BASE;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'x-user-id': 'demo-entrepreneur-001',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to load applications: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data || [];
  }

  static async getApplication(id) {
    const res = await fetch(`${API_BASE}/${id}`, {
      headers: {
        'Accept': 'application/json',
        'x-user-id': 'demo-entrepreneur-001',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to load application ${id}: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }

  static async createApplication(initialData = {}) {
    const res = await fetch(API_BASE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-user-id': 'demo-entrepreneur-001',
      },
      body: JSON.stringify(initialData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to create application draft: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }

  static async updateBusinessProfile(id, profile) {
    const res = await fetch(`${API_BASE}/${id}/business-profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-user-id': 'demo-entrepreneur-001',
      },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to update business profile: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }

  static async generateApprovals(id) {
    const res = await fetch(`${API_BASE}/${id}/generate-approvals`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'x-user-id': 'demo-entrepreneur-001',
      },
    });
    if (!res.ok) {
      throw new Error(`Failed to generate approvals: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }

  static async uploadDocument(id, documentId, file) {
    const formData = new FormData();
    formData.append('documentId', documentId);
    formData.append('file', file);

    const res = await fetch(`${API_BASE}/${id}/documents`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'x-user-id': 'demo-entrepreneur-001',
      },
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to upload document: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }

  static async removeDocument(id, documentId) {
    const res = await fetch(`${API_BASE}/${id}/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'x-user-id': 'demo-entrepreneur-001',
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to remove document: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }

  static async updateCurrentStep(id, step) {
    const res = await fetch(`${API_BASE}/${id}/current-step`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'x-user-id': 'demo-entrepreneur-001',
      },
      body: JSON.stringify({ step }),
    });
    if (!res.ok) {
      throw new Error(`Failed to update step: HTTP ${res.status}`);
    }
    const json = await res.json();
    return json.data;
  }
}
