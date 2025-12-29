import axiosInstance from '@/lib/axios';
import { DOCUMENT_ENDPOINTS, SESSION_ENDPOINTS } from '@/lib/api-endpoints';

/**
 * Document API Service
 * All document-related API calls using axios
 */
export const documentService = {
    /**
     * List all documents for the authenticated user
     */
    list: async () => {
        const response = await axiosInstance.get(DOCUMENT_ENDPOINTS.LIST);
        return response.data;
    },

    /**
     * Get a single document by ID
     */
    get: async (id) => {
        const response = await axiosInstance.get(DOCUMENT_ENDPOINTS.DETAIL(id));
        return response.data;
    },

    /**
     * Upload a new document
     */
    upload: async (file, title = '') => {
        const formData = new FormData();
        formData.append('file', file);
        if (title) {
            formData.append('title', title);
        }

        const response = await axiosInstance.post(
            DOCUMENT_ENDPOINTS.UPLOAD,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            }
        );

        return response.data;
    },

    /**
     * Delete a document
     */
    delete: async (id) => {
        const response = await axiosInstance.delete(DOCUMENT_ENDPOINTS.DETAIL(id));
        return response.data;
    },

    /**
     * Chat with a document using RAG
     */
    chat: async (documentId, query, sessionId = null) => {
        const body = { query };
        if (sessionId) {
            body.session_id = sessionId;
        }

        const response = await axiosInstance.post(
            DOCUMENT_ENDPOINTS.CHAT(documentId),
            body
        );

        return response.data;
    },

    /**
     * Get legal clause analysis for a document
     */
    getClauses: async (documentId) => {
        const response = await axiosInstance.post(
            DOCUMENT_ENDPOINTS.CLAUSES(documentId)
        );
        return response.data;
    },

    /**
     * Get executive summary for a document
     */
    getSummary: async (documentId) => {
        const response = await axiosInstance.post(
            DOCUMENT_ENDPOINTS.SUMMARY(documentId)
        );
        return response.data;
    },
};

