import { QueryClient } from '@tanstack/react-query';

// Create React Query client with default options
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1, // Retry failed requests once
            refetchOnWindowFocus: false, // Don't refetch on window focus
            staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
            gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 minutes (formerly cacheTime)
            refetchOnReconnect: true, // Refetch when reconnecting
        },
        mutations: {
            retry: 0, // Don't retry mutations
        },
    },
});

// Query keys for organization and cache invalidation
export const queryKeys = {
    auth: {
        currentUser: ['auth', 'currentUser'],
    },
    // Add more query keys as needed
    workspaces: {
        all: ['workspaces'],
        detail: (id) => ['workspaces', id],
    },
    documents: {
        all: ['documents'],
        detail: (id) => ['documents', id],
        clauses: (id) => ['documents', id, 'clauses'],
        summary: (id) => ['documents', id, 'summary'],
        compliance: (id, lawType) => ['documents', id, 'compliance', lawType],
        bilingualSummary: (id) => ['documents', id, 'bilingual-summary'],
        referenceData: (id) => ['documents', id, 'reference-data'],
    },
    sessions: {
        all: ['sessions'],
        detail: (id) => ['sessions', id],
    },
};
