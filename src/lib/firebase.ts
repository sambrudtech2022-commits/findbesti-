import { initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, Auth, ConfirmationResult } from "firebase/auth";
import { supabase } from "@/integrations/supabase/client";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

export const initFirebase = async (): Promise<Auth> => {
  if (firebaseAuth) return firebaseAuth;

  const { data, error } = await supabase.functions.invoke("firebase-config");
  if (error || !data?.apiKey) throw new Error("Failed to load Firebase config");

  firebaseApp = initializeApp({
    apiKey: data.apiKey,
    authDomain: data.authDomain,
    projectId: data.projectId,
  });

  firebaseAuth = getAuth(firebaseApp);
  firebaseAuth.useDeviceLanguage();
  return firebaseAuth;
};

export const setupRecaptcha = (auth: Auth, buttonId: string): RecaptchaVerifier => {
  const verifier = new RecaptchaVerifier(auth, buttonId, {
    size: "invisible",
    callback: () => {},
  });
  return verifier;
};

export const sendFirebaseOtp = async (
  phone: string,
  recaptchaVerifier: RecaptchaVerifier
): Promise<ConfirmationResult> => {
  const auth = await initFirebase();
  return signInWithPhoneNumber(auth, phone, recaptchaVerifier);
};

export type { ConfirmationResult, Auth };
