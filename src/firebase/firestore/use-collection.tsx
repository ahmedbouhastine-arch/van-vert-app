
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, query, collection, where, type Query, type DocumentData } from 'firebase/firestore';
import { useFirestore } from '../provider';

interface CollectionState<T> {
  data: T[] | null;
  loading: boolean;
}

export function useCollection<T extends DocumentData>(q: Query | null) {
  const [state, setState] = useState<CollectionState<T>>({ data: null, loading: true });

  useEffect(() => {
    if (!q) {
      setState({ data: [], loading: false });
      return;
    };
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
      setState({ data, loading: false });
    }, (error) => {
      console.error("Error fetching collection:", error);
      setState({ data: null, loading: false });
    });

    return () => unsubscribe();
  }, [q]);

  return state;
}
