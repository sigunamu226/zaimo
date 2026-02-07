"use client";

import { Button } from "@heroui/react";

export const StockHeader: React.FC = () => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold text-white">在庫一覧</h1>
      <Button
        className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold"
        onPress={() => alert("在庫追加機能は後で実装します")}
      >
        + 在庫を追加
      </Button>
    </div>
  );
};
