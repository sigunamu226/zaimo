"use client";

import { Chip } from "@heroui/react";
import type { ExpirationStatus } from "@/common/utils/date";

interface Props {
  status: ExpirationStatus;
}

const statusConfig = {
  expired: { color: "danger" as const, label: "期限切れ" },
  warning: { color: "warning" as const, label: "まもなく" },
  caution: { color: "secondary" as const, label: "注意" },
  safe: { color: "success" as const, label: "安全" },
};

export const ExpirationChip: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <Chip color={config.color} size="sm" variant="flat">
      {config.label}
    </Chip>
  );
};
