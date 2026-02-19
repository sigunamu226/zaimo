"use client";

import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { logout } from "@/services/header";

interface Props {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export const LogoutConfirmModal: React.FC<Props> = ({ isOpen, onOpenChange }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = async (onClose: () => void) => {
    setIsLoggingOut(true);
    setError("");

    try {
      await logout(router);
      onClose();
    } catch {
      setError("ログアウトに失敗しました。もう一度お試しください。");
    } finally {
      setIsLoggingOut(false);
    }
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
            <ModalHeader className="text-white">ログアウト</ModalHeader>
            <ModalBody>
              {error && (
                <p className="text-red-400 text-sm">{error}</p>
              )}
              <p className="text-white">
                本当にログアウトしますか？
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
                isLoading={isLoggingOut}
                onPress={() => handleLogout(onClose)}
              >
                ログアウト
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
