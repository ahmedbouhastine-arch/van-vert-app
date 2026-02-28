
'use client';

import { collection, query, where } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useFirestore } from "@/firebase";
import Link from 'next/link';

function AdminApplicationsPage() {
  const firestore = useFirestore();
  const applicationsRef = collection(firestore, 'applications');

  const allQuery = query(applicationsRef);
  const [allApplications, allLoading, allError] = useCollection(allQuery);

  const draftQuery = query(applicationsRef, where('status', '==', 'draft'));
  const [draftApplications, draftLoading, draftError] = useCollection(draftQuery);

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div>
        <h1 className="text-2xl font-semibold mb-4">All Applications</h1>
        {allLoading && <p>Loading...</p>}
        {allError && <p>Error: {allError.message}</p>}
        {allApplications && (
          <div className="space-y-4">
            {allApplications.docs.map((doc) => (
              <Link key={doc.id} href={`/admin/applications/${doc.id}`}>
                <div className="block p-4 border rounded-lg hover:bg-gray-50">
                  <h2 className="text-lg font-semibold">{doc.data().name}</h2>
                  <p className="text-sm text-gray-500">{doc.data().email}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h1 className="text-2xl font-semibold mb-4">Draft Applications</h1>
        {draftLoading && <p>Loading...</p>}
        {draftError && <p>Error: {draftError.message}</p>}
        {draftApplications && (
          <div className="space-y-4">
            {draftApplications.docs.map((doc) => (
              <Link key={doc.id} href={`/admin/applications/${doc.id}`}>
                <div className="block p-4 border rounded-lg hover:bg-gray-50">
                  <h2 className="text-lg font-semibold">{doc.data().name}</h2>
                  <p className="text-sm text-gray-500">{doc.data().email}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminApplicationsPage;
