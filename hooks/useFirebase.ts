import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getDocument, 
  getDocuments, 
  createDocument, 
  updateDocument, 
  deleteDocument,
  buildQuery 
} from '@/services/firestore/utils';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, QueryConstraint } from 'firebase/firestore';
import { db } from '@/config/firebase';

export function useFirestoreDocument<T>(
  collectionName: string,
  documentId: string | undefined,
  options?: { enabled?: boolean }
) {
  return useQuery({
    queryKey: [collectionName, documentId],
    queryFn: () => {
      if (!documentId) throw new Error('Document ID is required');
      return getDocument<T>(collectionName, documentId);
    },
    enabled: options?.enabled !== false && !!documentId,
  });
}

export function useFirestoreCollection<T>(
  collectionName: string,
  constraints?: QueryConstraint[],
  options?: { enabled?: boolean }
) {
  const constraintsKey = JSON.stringify(constraints);
  
  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return useQuery({
    queryKey: [collectionName, 'list', constraintsKey],
    queryFn: () => getDocuments<T>(collectionName, constraints || []),
    enabled: options?.enabled !== false,
  });
}

export function useFirestoreQuery<T>(
  collectionName: string,
  filters?: { field: string; operator: any; value: any }[],
  orderByField?: string,
  orderDirection?: 'asc' | 'desc',
  limitCount?: number,
  options?: { enabled?: boolean }
) {
  const constraints = buildQuery(
    collectionName,
    filters,
    orderByField,
    orderDirection,
    limitCount
  );

  // eslint-disable-next-line @tanstack/query/exhaustive-deps
  return useQuery({
    queryKey: [collectionName, 'query', filters, orderByField, orderDirection, limitCount],
    queryFn: () => getDocuments<T>(collectionName, constraints),
    enabled: options?.enabled !== false,
  });
}

export function useCreateDocument<T>(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, documentId }: { data: T; documentId?: string }) =>
      createDocument(collectionName, data, documentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [collectionName] });
    },
  });
}

export function useUpdateDocument<T>(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ documentId, data }: { documentId: string; data: Partial<T> }) =>
      updateDocument(collectionName, documentId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [collectionName] });
      queryClient.invalidateQueries({ queryKey: [collectionName, variables.documentId] });
    },
  });
}

export function useDeleteDocument(collectionName: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (documentId: string) => deleteDocument(collectionName, documentId),
    onSuccess: (_, documentId) => {
      queryClient.invalidateQueries({ queryKey: [collectionName] });
      queryClient.invalidateQueries({ queryKey: [collectionName, documentId] });
    },
  });
}

export function useRealtimeDocument<T>(
  collectionName: string,
  documentId: string | undefined
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!documentId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const docRef = collection(db, collectionName);
    const q = query(docRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const doc = snapshot.docs.find(d => d.id === documentId);
        if (doc) {
          setData({ id: doc.id, ...doc.data() } as T);
        } else {
          setData(null);
        }
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Realtime document error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [collectionName, documentId]);

  return { data, loading, error };
}

export function useRealtimeCollection<T>(
  collectionName: string,
  constraints?: QueryConstraint[]
) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const constraintsKey = JSON.stringify(constraints);

  useEffect(() => {
    setLoading(true);
    const collectionRef = collection(db, collectionName);
    const q = constraints ? query(collectionRef, ...constraints) : query(collectionRef);

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const documents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as T[];
        setData(documents);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Realtime collection error:', err);
        setError(err as Error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName, constraintsKey]);

  return { data, loading, error };
}

export function useRealtimeQuery<T>(
  collectionName: string,
  filters?: { field: string; operator: any; value: any }[],
  orderByField?: string,
  orderDirection?: 'asc' | 'desc',
  limitCount?: number
) {
  const constraints = buildQuery(
    collectionName,
    filters,
    orderByField,
    orderDirection,
    limitCount
  );

  return useRealtimeCollection<T>(collectionName, constraints);
}
