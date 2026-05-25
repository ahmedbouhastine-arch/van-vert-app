'use client';
    
import { useState, useEffect } from 'react';
import {
  DocumentReference,
  onSnapshot,
  getDoc,
  DocumentData,
  FirestoreError,
  DocumentSnapshot,
} from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

/** Utility type to add an 'id' field to a given type T. */
type WithId<T> = T & { id: string };

/**
 * Interface for the return value of the useDoc hook.
 * @template T Type of the document data.
 */
export interface UseDocResult<T> {
  data: WithId<T> | null; // Document data with ID, or null.
  isLoading: boolean;       // True if loading.
  error: FirestoreError | Error | null; // Error object, or null.
}

/**
 * React hook to subscribe to a single Firestore document in real-time.
 * This hook is robust against race conditions by performing an initial `getDoc`
 * before attaching the real-time `onSnapshot` listener.
 * 
 * IMPORTANT! YOU MUST MEMOIZE the inputted memoizedDocRef or BAD THINGS WILL HAPPEN
 * use useMemoFirebase to memoize it per React guidance.
 *
 * @template T Optional type for document data. Defaults to any.
 * @param {DocumentReference<DocumentData> | null | undefined} memoizedDocRef -
 * The Firestore DocumentReference, memoized with useMemoFirebase. Waits if null/undefined.
 * @returns {UseDocResult<T>} Object with data, isLoading, error.
 */
export function useDoc<T = unknown>(
  memoizedDocRef: DocumentReference<DocumentData> | null | undefined,
): UseDocResult<T> {
  type StateDataType = WithId<T> | null;

  const [data, setData] = useState<StateDataType>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Default to true to handle initial load
  const [error, setError] = useState<FirestoreError | Error | null>(null);

  useEffect(() => {
    if (!memoizedDocRef) {
      setIsLoading(false);
      setData(null);
      setError(null);
      return;
    }
    
    // This is a check to enforce memoization of the doc ref, which is critical for performance.
    if (!((memoizedDocRef as { __memo?: boolean } | null)?.__memo)) {
        throw new Error('The DocumentReference passed to useDoc must be memoized with useMemoFirebase.');
    }

    let unsubscribe = () => {};
    let isMounted = true;

    const fetchDataAndListen = async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Perform a one-time fetch to get the initial state, which avoids race conditions on create/redirect.
            const docSnap = await getDoc(memoizedDocRef);
            
            if (!isMounted) return;

            if (docSnap.exists()) {
                const initialData = { ...(docSnap.data() as T), id: docSnap.id };
                setData(initialData);

                // After getting the initial state, attach the real-time listener for updates.
                unsubscribe = onSnapshot(
                    memoizedDocRef,
                    (snapshot: DocumentSnapshot<DocumentData>) => {
                        if (snapshot.exists()) {
                            setData({ ...(snapshot.data() as T), id: snapshot.id });
                        } else {
                            setData(null); // The document was deleted.
                        }
                        setError(null);
                    },
                    (_listenerError: FirestoreError) => {
                        // Handle errors on the real-time listener
                        const contextualError = new FirestorePermissionError({
                            operation: 'get', // Listening is a 'get' operation
                            path: memoizedDocRef.path,
                        });
                        setError(contextualError);
                        errorEmitter.emit('permission-error', contextualError);
                    }
                );
            } else {
                setData(null); // Document does not exist.
            }
        } catch {
            // Handle errors from the initial getDoc call
            const contextualError = new FirestorePermissionError({
                operation: 'get',
                path: memoizedDocRef.path,
            });
            setError(contextualError);
            errorEmitter.emit('permission-error', contextualError);
        } finally {
            if (isMounted) {
                setIsLoading(false);
            }
        }
    };

    fetchDataAndListen();

    // Cleanup function
    return () => {
        isMounted = false;
        unsubscribe(); // Detach the real-time listener
    };
  }, [memoizedDocRef]);

  return { data, isLoading, error };
}
