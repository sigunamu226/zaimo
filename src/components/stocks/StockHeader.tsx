"use client";

import { Button, useDisclosure } from "@heroui/react";
import dynamic from "next/dynamic";

const AddStockModal = dynamic(
  () => import("./AddStockModal").then((m) => ({ default: m.AddStockModal })),
);

export const StockHeader: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <div className="flex items-center justify-between mb-6">
      <h2 className="text-2xl font-bold text-white">在庫一覧</h2>
      <Button
        className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold"
        onPress={onOpen}
      >
        + 在庫を追加
      </Button>
      <AddStockModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </div>
  );
};
