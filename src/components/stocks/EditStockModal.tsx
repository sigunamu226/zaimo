"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Button,
  DatePicker,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { updateStock } from "@/repositories/server/stocks";
import type { DateValue } from "@internationalized/date";
import { parseDate } from "@internationalized/date";
import type { Stock } from "@/common/interface/stock";

interface Props {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  stock: Stock;
}

export const EditStockModal: React.FC<Props> = ({ isOpen, onOpenChange, stock }) => {
  const [name, setName] = useState(stock.name);
  const [quantity, setQuantity] = useState(stock.quantity.toString());
  const [expirationDate, setExpirationDate] = useState<DateValue | null>(
    parseDate(stock.expiration_date.split('T')[0])
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setName(stock.name);
    setQuantity(stock.quantity.toString());
    setExpirationDate(parseDate(stock.expiration_date.split('T')[0]));
  }, [stock]);

  const isValid = name.trim() !== "" && quantity !== "" && Number(quantity) >= 1 && expirationDate !== null;

  const handleSubmit = async (onClose: () => void) => {
    if (!isValid) return;
    setIsSubmitting(true);
    setError("");

    const result = await updateStock(stock.id, {
      name: name.trim(),
      quantity: Number(quantity),
      expiration_date: expirationDate!.toString(),
    });

    setIsSubmitting(false);

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
            <ModalHeader className="text-white">在庫を編集</ModalHeader>
            <ModalBody className="gap-4">
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <Input
                label="商品名"
                labelPlacement="outside"
                placeholder="例: 牛乳"
                variant="bordered"
                radius="sm"
                isRequired
                value={name}
                onChange={(e) => setName(e.target.value)}
                classNames={{
                  inputWrapper: "bg-black/40 border border-gray-700",
                  input: "text-white placeholder-gray-400",
                  label: "!text-white",
                }}
              />
              <Input
                type="number"
                label="数量"
                labelPlacement="outside"
                placeholder="例: 3"
                variant="bordered"
                radius="sm"
                isRequired
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                classNames={{
                  inputWrapper: "bg-black/40 border border-gray-700",
                  input: "text-white placeholder-gray-400",
                  label: "!text-white",
                }}
              />
              <DatePicker
                label="消費期限"
                labelPlacement="outside"
                variant="bordered"
                isRequired
                value={expirationDate}
                onChange={setExpirationDate}
                classNames={{
                  base: "w-full",
                  inputWrapper: "bg-black/40 border border-gray-700 [&_input]:!text-white",
                  input: "!text-white",
                  innerWrapper: "!text-white",
                  segment: "!text-white",
                  label: "!text-white",
                  selectorButton: "text-gray-400",
                }}
              />
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
                className="bg-gradient-to-r from-[#9945FF] to-[#14F195] text-white font-bold"
                isDisabled={!isValid}
                isLoading={isSubmitting}
                onPress={() => handleSubmit(onClose)}
              >
                更新する
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
