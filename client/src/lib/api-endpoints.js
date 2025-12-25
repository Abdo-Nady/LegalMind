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
};

// Add more endpoint categories as your app grows
export const WORKSPACE_ENDPOINTS = {
    // Example: LIST: '/workspaces/',
    // Example: DETAIL: (id) => `/workspaces/${id}/`,
};

export const DOCUMENT_ENDPOINTS = {
    // Example: UPLOAD: '/documents/upload/',
};
