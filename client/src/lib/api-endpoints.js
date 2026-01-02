// API Endpoint Constants
export const AUTH_ENDPOINTS = {
    REGISTER: '/accounts/register/',
    LOGIN: '/accounts/login/',
    LOGOUT: '/accounts/logout/',
    TOKEN_REFRESH: '/accounts/token/refresh/',
    ME: '/accounts/me/',
    GOOGLE_LOGIN: '/accounts/google/',
    AVATAR_UPLOAD: '/accounts/profile/avatar/',
    AVATAR_DELETE: '/accounts/profile/avatar/',
    CHANGE_PASSWORD: '/accounts/password/change/',
    PASSWORD_RESET: '/accounts/password/reset/',
    PASSWORD_RESET_CONFIRM: '/accounts/password/reset/confirm/',
};

// Add more endpoint categories as your app grows
export const WORKSPACE_ENDPOINTS = {
    // Example: LIST: '/workspaces/',
    // Example: DETAIL: (id) => `/workspaces/${id}/`,
};

export const DOCUMENT_ENDPOINTS = {
    LIST: '/ai/documents/',
    UPLOAD: '/ai/documents/upload/',
    DETAIL: (id) => `/ai/documents/${id}/`,
    CHAT: (id) => `/ai/documents/${id}/chat/`,
    CLAUSES: (id) => `/ai/documents/${id}/clauses/`,
    SUMMARY: (id) => `/ai/documents/${id}/summary/`,
};

export const SESSION_ENDPOINTS = {
    LIST: '/ai/sessions/',
    DETAIL: (id) => `/ai/sessions/${id}/`,
};
