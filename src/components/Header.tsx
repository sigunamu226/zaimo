"use client";

import { logout } from "@/services/header";
import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React from "react";

export const Header: React.FC = () => {
  const router = useRouter();

  return (
    <header className="w-full h-16 bg-black/60 backdrop-blur-md text-white flex items-center justify-between px-6 shadow-sm border-b border-white/10 z-50">
      {/* Left: Logo */}
      <Link
        href="/stocks"
        className="text-xl font-bold tracking-tight flex items-center gap-1"
      >
        🥦 <span className="hidden sm:inline">Zaimo</span>
      </Link>

      {/* Right: Avatar & Dropdown */}
      <Dropdown placement="bottom-end">
        <DropdownTrigger>
          <Avatar isBordered size="sm" color="secondary" name="User" />
        </DropdownTrigger>
        <DropdownMenu aria-label="User menu" variant="flat">
          <DropdownItem key="settings">設定</DropdownItem>
          <DropdownItem
            key="logout"
            className="text-danger"
            color="danger"
            onPress={() => logout(router)}
          >
            ログアウト
          </DropdownItem>
        </DropdownMenu>
      </Dropdown>
    </header>
  );
};
