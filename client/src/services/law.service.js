import axiosInstance from '@/lib/axios';
import { LAW_ENDPOINTS } from '@/lib/api-endpoints';

/**
 * Egyptian Law API Service
 * All law-related API calls using axios
 */
export const lawService = {
    /**
     * List all available Egyptian laws
     */
    list: async () => {
        const response = await axiosInstance.get(LAW_ENDPOINTS.LIST);
        return response.data;
    },

    /**
     * Get a single law by slug
     */
    get: async (slug) => {
        const response = await axiosInstance.get(LAW_ENDPOINTS.DETAIL(slug));
        return response.data;
    },

    /**
     * Chat with a law using RAG
     */
    chat: async (slug, query, sessionId = null) => {
        const body = { query };
        if (sessionId) {
            body.session_id = sessionId;
        }

        const response = await axiosInstance.post(
            LAW_ENDPOINTS.CHAT(slug),
            body
        );

        return response.data;
    },

    /**
     * Get legal clause analysis for a law
     */
    getClauses: async (slug) => {
        const response = await axiosInstance.post(
            LAW_ENDPOINTS.CLAUSES(slug)
        );
        return response.data;
    },

    /**
     * Get executive summary for a law
     */
    getSummary: async (slug) => {
        const response = await axiosInstance.post(
            LAW_ENDPOINTS.SUMMARY(slug)
        );
        return response.data;
    },

    /**
     * List all law chat sessions for the user
     */
    listSessions: async () => {
        const response = await axiosInstance.get(LAW_ENDPOINTS.SESSIONS);
        return response.data;
    },

    /**
     * Get a specific law chat session
     */
    getSession: async (sessionId) => {
        const response = await axiosInstance.get(LAW_ENDPOINTS.SESSION_DETAIL(sessionId));
        return response.data;
    },

    /**
     * Delete a law chat session
     */
    deleteSession: async (sessionId) => {
        const response = await axiosInstance.delete(LAW_ENDPOINTS.SESSION_DETAIL(sessionId));
        return response.data;
    },
};
