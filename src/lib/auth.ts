
import { adminAuth } from "@/lib/firebase-admin-prewarmed";
import { headers } from "next/headers";

export async function getAuthenticatedUser() {
  const authorization = headers().get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No token provided.");
  }
  const idToken = authorization.split("Bearer ")[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying auth token:", error);
    throw new Error("Unauthorized: Invalid token.");
  }
}
