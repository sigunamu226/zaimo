"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useState } from "react";
import { deleteStock } from "@/repositories/server/stocks";
import type { Stock } from "@/common/interface/stock";

interface Props {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  stock: Stock;
}

export const DeleteStockModal: React.FC<Props> = ({ isOpen, onOpenChange, stock }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async (onClose: () => void) => {
    setIsDeleting(true);
    setError("");

    const result = await deleteStock(stock.id);

    setIsDeleting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      classNames={{
        base: "bg-gray-900 border border-white/10",
        header: "border-b border-gray-700",
        footer: "border-t border-gray-700",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="text-white">在庫を削除</ModalHeader>
            <ModalBody>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <p className="text-white">
                「{stock.name}」を削除してもよろしいですか？
              </p>
              <p className="text-gray-400 text-sm">
                この操作は取り消せません。
              </p>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="light"
                className="text-gray-400"
                onPress={onClose}
              >
                キャンセル
              </Button>
              <Button
                color="danger"
                isLoading={isDeleting}
                onPress={() => handleDelete(onClose)}
              >
                削除する
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
