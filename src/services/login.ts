import { supabase } from "@/common/supabase";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const login = async (
  router: AppRouterInstance,
  email: string,
  password: string
): Promise<void> => {
  if (!email || !password) {
    return Promise.reject(new Error("Email and password are required"));
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return Promise.reject(error);
  }

  router.push("/stocks");
};
