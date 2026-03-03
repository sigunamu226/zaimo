"use client";

import { signup } from "@/services/signup";
import { Button, Input, Link } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [passwordConfirm, setPasswordConfirm] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password || !passwordConfirm) {
      setError("すべての項目を入力してください");
      return;
    }

    if (password !== passwordConfirm) {
      setError("パスワードが一致しません");
      return;
    }

    if (password.length < 6) {
      setError("パスワードは6文字以上で入力してください");
      return;
    }

    setIsLoading(true);
    try {
      await signup(router, email, password);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("アカウントの作成に失敗しました");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-screen px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl px-8 py-10 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-white">Zaimo🥦</h1>
          <p className="text-sm text-gray-400">アカウントを作成</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            name="email"
            autoComplete="email"
            label="メールアドレス"
            labelPlacement="outside"
            placeholder="you@example.com"
            variant="bordered"
            radius="sm"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            classNames={{
              inputWrapper: "bg-black/40 border border-gray-700 my-6",
              input: "text-white placeholder-gray-400",
              label: "!text-white",
            }}
          />

          <Input
            type="password"
            name="password"
            autoComplete="new-password"
            label="パスワード"
            labelPlacement="outside"
            placeholder="••••••••"
            variant="bordered"
            radius="sm"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            classNames={{
              inputWrapper: "bg-black/40 border border-gray-700 mb-6",
              input: "text-white placeholder-gray-400",
              label: "!text-white",
            }}
          />

          <Input
            type="password"
            name="password-confirm"
            autoComplete="new-password"
            label="パスワード(確認)"
            labelPlacement="outside"
            placeholder="••••••••"
            variant="bordered"
            radius="sm"
            value={passwordConfirm}
            onChange={(e) => setPasswordConfirm(e.currentTarget.value)}
            classNames={{
              inputWrapper: "bg-black/40 border border-gray-700",
              input: "text-white placeholder-gray-400",
              label: "!text-white",
            }}
          />

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <Button
            type="submit"
            fullWidth
            size="lg"
            radius="sm"
            isLoading={isLoading}
            className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold hover:opacity-90 transition py-3"
          >
            サインアップ
          </Button>
        </form>

        <p className="text-sm text-center text-gray-400">
          すでにアカウントをお持ちの方はこちら{" "}
          <Link
            href="/login"
            className="text-[#14F195] font-semibold hover:underline"
          >
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
