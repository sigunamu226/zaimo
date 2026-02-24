import { createClient } from "@/common/supabase/client";
import { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const signup = async (
  router: AppRouterInstance,
  email: string,
  password: string
): Promise<void> => {
  if (!email || !password) {
    return Promise.reject(
      new Error("メールアドレスとパスワードを入力してください")
    );
  }

  if (password.length < 6) {
    return Promise.reject(
      new Error("パスワードは6文字以上で入力してください")
    );
  }

  const supabase = createClient();
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return Promise.reject(
      new Error("アカウントの作成に失敗しました")
    );
  }

  router.push("/stocks");
};
