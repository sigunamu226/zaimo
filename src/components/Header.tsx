"use client";

import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  useDisclosure,
} from "@heroui/react";
import Link from "next/link";
import React from "react";
import { HamburgerIcon, SettingsIcon, LogoutIcon } from "./icons";
import { LogoutConfirmModal } from "./LogoutConfirmModal";

export const Header: React.FC = () => {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <header className="w-full h-16 bg-black/60 backdrop-blur-md text-white flex items-center justify-between px-6 shadow-sm border-b border-white/10 z-50">
      {/* Left: Logo */}
      <Link
        href="/stocks"
        className="text-xl font-bold tracking-tight flex items-center gap-1"
      >
        🥦 <span className="hidden sm:inline">Zaimo</span>
      </Link>

      {/* Right: Hamburger Menu & Dropdown */}
      <Dropdown
        placement="bottom-end"
        classNames={{
          content:
            "bg-gray-900 border border-white/10 shadow-xl shadow-black/50",
        }}
      >
        <DropdownTrigger>
          <button className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-white/20 transition-all duration-200 cursor-pointer">
            <HamburgerIcon />
          </button>
        </DropdownTrigger>
        <DropdownMenu
          aria-label="User menu"
          itemClasses={{
            base: "text-white data-[hover=true]:bg-white/20 data-[hover=true]:text-white",
          }}
        >
          <DropdownSection
            title="ログイン中"
            showDivider
            classNames={{
              divider: "bg-white/10",
              heading: "text-gray-400 text-xs font-medium",
            }}
          >
            <DropdownItem key="profile" className="h-10 gap-2" isReadOnly>
              <p className="font-semibold text-white">User</p>
            </DropdownItem>
          </DropdownSection>
          <DropdownSection>
            <DropdownItem key="settings" startContent={<SettingsIcon />}>
              設定
            </DropdownItem>
            <DropdownItem
              key="logout"
              color="danger"
              className="text-danger data-[hover=true]:bg-danger/20"
              startContent={<LogoutIcon />}
              onPress={onOpen}
            >
              ログアウト
            </DropdownItem>
          </DropdownSection>
        </DropdownMenu>
      </Dropdown>
      <LogoutConfirmModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </header>
  );
};
