import { Button, Input, Link } from "@heroui/react";

export default function Page() {
  return (
    <div className="flex items-center justify-center w-full h-screen px-4">
      <div className="w-full max-w-md rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 shadow-2xl px-8 py-10 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="text-3xl font-bold text-white">Zaimo🥦</h1>
        </div>

        <Input
          type="email"
          label="メールアドレス"
          labelPlacement="outside"
          placeholder="you@example.com"
          variant="bordered"
          classNames={{
            inputWrapper: "bg-black/40 border border-gray-700 my-6",
            input: "text-white placeholder-gray-400",
            label: "!text-white",
          }}
        />

        <Input
          type="password"
          label="パスワード"
          labelPlacement="outside"
          placeholder="••••••••"
          variant="bordered"
          fullWidth
          size="lg"
          radius="sm"
          classNames={{
            inputWrapper: "bg-black/40 border border-gray-700",
            input: "text-white placeholder-gray-400",
            label: "!text-white",
          }}
        />

        <div className="text-right text-sm">
          <a href="#" className="text-[#9945FF] hover:underline">
            パスワードを忘れた?
          </a>
        </div>

        <Button
          fullWidth
          size="lg"
          radius="sm"
          className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold hover:opacity-90 transition py-3"
        >
          ログイン
        </Button>

        <p className="text-sm text-center text-gray-400">
          アカウント未登録の方はこちら{" "}
          <Link
            href="/signup"
            className="text-[#14F195] font-semibold hover:underline"
          >
            サインアップ
          </Link>
        </p>
      </div>
    </div>
  );
}
