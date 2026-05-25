
import { NextResponse } from "next/server";
import { adminAuth, adminFirestore } from "@/lib/firebase-admin-prewarmed";

export async function POST(request: Request) {
  try {
    const idToken = request.headers.get("Authorization")?.split("Bearer ")[1];

    if (!idToken) {
      return NextResponse.json(
        { message: "Authorization header missing" },
        { status: 401 }
      );
    }

    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn,
    });

    // --- Backend Auto-Linking (Migration) Logic ---
    try {
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const newUid = decodedToken.uid;
        const email = decodedToken.email;

        if (email) {
            const usersRef = adminFirestore.collection('users');
            const duplicateUsersQuery = await usersRef.where('email', '==', email).get();

            const oldUids: string[] = [];
            duplicateUsersQuery.forEach((docSnapshot) => {
                if (docSnapshot.id !== newUid) {
                    oldUids.push(docSnapshot.id);
                }
            });

            if (oldUids.length > 0) {
                console.log(`Backend linking detected for ${email}: Merging ${oldUids.length} old accounts into ${newUid}`);
                const batch = adminFirestore.batch();
                
                for (const oldUid of oldUids) {
                    // Update applications to new UID
                    const userAppsQuery = await adminFirestore.collection('applications').where('userId', '==', oldUid).get();
                    userAppsQuery.forEach((docSnapshot) => {
                        batch.update(docSnapshot.ref, { userId: newUid, _migratedFrom: oldUid });
                    });

                    // Merge core profile data if possible
                    const oldUserDoc = await usersRef.doc(oldUid).get();
                    const oldData = oldUserDoc.data();
                    if (oldData) {
                        batch.set(usersRef.doc(newUid), {
                            displayName: oldData.displayName,
                            birthDate: oldData.birthDate,
                            photoURL: oldData.photoURL,
                            role: oldData.role || 'user'
                        }, { merge: true });
                    }

                    // Remove old user document to finalize linking
                    batch.delete(usersRef.doc(oldUid));
                }
                await batch.commit();
            }
        }
    } catch (linkError) {
        // Log migration error but don't fail the entire login session
        console.error("Non-critical account linking error:", linkError);
    }

    const response = NextResponse.json({ message: "Session created" });
    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn,
      path: "/",
      sameSite: 'lax',
    });

    return response;
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
