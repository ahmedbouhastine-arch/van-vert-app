
import { adminAuth } from "@/lib/firebase-admin-prewarmed";
import { headers } from "next/headers";

export async function getAuthenticatedUser(idToken?: string) {
  const hdrs = await headers();
  const authorization = hdrs.get("Authorization");
  let token = idToken;

  if (!token) {
    if (!authorization?.startsWith("Bearer ")) {
      throw new Error("Unauthorized: No token provided.");
    }
    token = authorization.split("Bearer ")[1];
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token as string);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying auth token:", error);
    throw new Error("Unauthorized: Invalid token.");
  }
}
