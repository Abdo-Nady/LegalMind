import axiosInstance from '@/lib/axios';
import { DOCUMENT_ENDPOINTS, SESSION_ENDPOINTS } from '@/lib/api-endpoints';

/**
 * Document API Service
 * All document-related API calls using axios
 */
export const documentService = {
    /**
     * List all documents for the authenticated user
     * @param {string} searchQuery - Optional search query to filter documents by title
     */
    list: async (searchQuery = '') => {
        const params = {};
        if (searchQuery) {
            params.search = searchQuery;
        }
        const response = await axiosInstance.get(DOCUMENT_ENDPOINTS.LIST, { params });
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

    /**
     * Get compliance check for a document against Egyptian laws
     * @param {number} documentId - Document ID
     * @param {string} lawType - Type of law: 'labor', 'commercial', 'civil', 'tax', or 'general'
     */
    getCompliance: async (documentId, lawType = 'general') => {
        const response = await axiosInstance.post(
            DOCUMENT_ENDPOINTS.COMPLIANCE(documentId),
            { law_type: lawType }
        );
        return response.data;
    },

    /**
     * Get bilingual (Arabic/English) summary for a document
     */
    getBilingualSummary: async (documentId) => {
        const response = await axiosInstance.post(
            DOCUMENT_ENDPOINTS.BILINGUAL_SUMMARY(documentId)
        );
        return response.data;
    },

    /**
     * Get structured reference data from a document
     * Returns: parties, dates, financial terms, clause index, etc.
     */
    getReferenceData: async (documentId) => {
        const response = await axiosInstance.post(
            DOCUMENT_ENDPOINTS.REFERENCE_DATA(documentId)
        );
        return response.data;
    },
};

