import { useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/queryClient';
import { documentService } from '@/services/document.service';

/**
 * Custom hook to poll for document processing status
 * Automatically polls documents that are in "processing" state
 *
 * @param {Array} documents - Array of document objects
 * @param {number} interval - Polling interval in milliseconds (default: 5000)
 */
export function useDocumentPolling(documents, interval = 5000) {
  const queryClient = useQueryClient();
  const intervalRef = useRef(null);

  // Memoize processing document IDs
  const processingIds = useMemo(() => {
    return documents
      .filter(doc => doc.status === 'processing')
      .map(doc => doc.id);
  }, [documents]);

  useEffect(() => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (processingIds.length === 0) {
      return; // No documents to poll
    }

    // Poll all processing documents; keep interval conservative to respect API throttling.
    const pollDocuments = async () => {
      for (const docId of processingIds) {
        try {
          const updatedDoc = await documentService.get(docId);

          // If status changed from processing, invalidate queries to refresh the list
          if (updatedDoc.status !== 'processing') {
            queryClient.invalidateQueries({ queryKey: queryKeys.documents.all });
          }
        } catch (error) {
          console.error(`Failed to poll document ${docId}:`, error);
        }
      }
    };

    // Initial poll
    pollDocuments();

    // Set up polling interval
    intervalRef.current = setInterval(pollDocuments, interval);

    // Cleanup interval on unmount or when dependencies change
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [processingIds.join(','), interval, queryClient]);
}
