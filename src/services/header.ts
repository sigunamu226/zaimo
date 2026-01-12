import { createClient } from "@/common/supabase/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const logout = async (router: AppRouterInstance): Promise<void> => {
  const supabase = createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return Promise.reject(error);
  }

  router.push("/login");
};
