"use client";

import { Button, useDisclosure } from "@heroui/react";
import dynamic from "next/dynamic";

const AddStockModal = dynamic(
  () => import("./AddStockModal").then((m) => ({ default: m.AddStockModal })),
);

export const EmptyState: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="text-6xl mb-4">📦</div>
      <h2 className="text-xl font-semibold text-white mb-2">
        在庫がありません
      </h2>
      <p className="text-gray-400 mb-6">
        最初の在庫を追加して管理を始めましょう
      </p>
      <Button
        className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold"
        size="lg"
        onPress={onOpen}
      >
        + 在庫を追加
      </Button>
      <AddStockModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </div>
  );
};
