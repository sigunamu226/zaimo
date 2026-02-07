"use client";

import { Button } from "@heroui/react";

export const EmptyState: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">📦</div>
      <h3 className="text-xl font-semibold text-white mb-2">
        在庫がありません
      </h3>
      <p className="text-gray-400 mb-6">
        最初の在庫を追加して管理を始めましょう
      </p>
      <Button
        className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold"
        size="lg"
        onPress={() => alert("在庫追加機能は後で実装します")}
      >
        + 在庫を追加
      </Button>
    </div>
  );
};
