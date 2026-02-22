
import { NextResponse } from "next/server";
import { auth } from "firebase-admin";
import { getAuth } from "firebase-admin/auth";
import { initFirebaseAdmin } from "@/firebase/admin-init";

// Initialize Firebase Admin SDK
initFirebaseAdmin();

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
    const sessionCookie = await getAuth().createSessionCookie(idToken, {
      expiresIn,
    });

    const response = NextResponse.json({ message: "Session created" });
    response.cookies.set("session", sessionCookie, {
      httpOnly: true,
      secure: true,
      maxAge: expiresIn,
      path: "/",
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
