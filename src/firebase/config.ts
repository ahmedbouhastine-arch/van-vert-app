const webAppConfig = process.env.FIREBASE_WEBAPP_CONFIG
  ? JSON.parse(process.env.FIREBASE_WEBAPP_CONFIG)
  : {};

export const firebaseConfig = {
  apiKey: webAppConfig.apiKey ?? process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: webAppConfig.authDomain ?? process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: webAppConfig.projectId ?? process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: webAppConfig.storageBucket ?? process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: webAppConfig.messagingSenderId ?? process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: webAppConfig.appId ?? process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: webAppConfig.measurementId ?? process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};