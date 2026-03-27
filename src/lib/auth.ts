import { initializeApp, getApps } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { NextRequest } from "next/server";

let _adminAuth: Auth | null = null;

function getAdminAuth(): Auth {
  if (!_adminAuth) {
    if (getApps().length === 0) {
      initializeApp({ projectId: process.env.FIREBASE_PROJECT_ID });
    }
    _adminAuth = getAuth();
  }
  return _adminAuth;
}

export async function verifyToken(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }
  const token = authHeader.slice(7);
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}
