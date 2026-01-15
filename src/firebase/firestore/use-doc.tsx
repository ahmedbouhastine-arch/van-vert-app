
'use client';

import { useState, useEffect } from 'react';
import { onSnapshot, type DocumentReference, type DocumentData } from 'firebase/firestore';

interface DocState<T> {
  data: T | null;
  loading: boolean;
}

export function useDoc<T extends DocumentData>(ref: DocumentReference<T> | null) {
  const [state, setState] = useState<DocState<T>>({ data: null, loading: true });

  useEffect(() => {
    if (!ref) {
        setState({ data: null, loading: false });
        return;
    }

    const unsubscribe = onSnapshot(ref, (doc) => {
        if (doc.exists()) {
            setState({ data: { id: doc.id, ...doc.data() } as T, loading: false });
        } else {
            setState({ data: null, loading: false });
        }
    }, (error) => {
        console.error("Error fetching document:", error);
        setState({ data: null, loading: false });
    });

    return () => unsubscribe();
  }, [ref]);

  return state;
}
