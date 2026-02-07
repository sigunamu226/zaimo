"use client";

import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Input,
  Tabs,
  Tab,
  Button,
  SortDescriptor,
} from "@heroui/react";
import { useState, useMemo } from "react";
import type { Stock } from "@/common/interface/stock";
import { ExpirationChip } from "./ExpirationChip";
import { EmptyState } from "./EmptyState";
import { formatDate, getExpirationStatus } from "@/common/utils/date";

interface Props {
  stocks: Stock[];
}

export const StockTable: React.FC<Props> = ({ stocks }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "expiration_date",
    direction: "ascending",
  });

  const filteredAndSortedStocks = useMemo(() => {
    let result = stocks;

    // 検索フィルター
    if (searchQuery) {
      result = result.filter((stock) =>
        stock.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ステータスフィルター
    if (filter !== "all") {
      result = result.filter((stock) => {
        const status = getExpirationStatus(stock.expiration_date);
        if (filter === "expired") return status === "expired";
        if (filter === "warning")
          return status === "warning" || status === "caution";
        if (filter === "safe") return status === "safe";
        return true;
      });
    }

    // ソート
    result = [...result].sort((a, b) => {
      const col = sortDescriptor.column as keyof Stock;
      const aVal = a[col];
      const bVal = b[col];

      let cmp = 0;
      if (typeof aVal === "string" && typeof bVal === "string") {
        cmp = aVal.localeCompare(bVal);
      } else if (typeof aVal === "number" && typeof bVal === "number") {
        cmp = aVal - bVal;
      }

      return sortDescriptor.direction === "ascending" ? cmp : -cmp;
    });

    return result;
  }, [stocks, searchQuery, filter, sortDescriptor]);

  if (stocks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-4">
      {/* フィルターセクション */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <Input
          placeholder="商品名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          variant="bordered"
          size="sm"
          className="max-w-xs"
          classNames={{
            inputWrapper: "bg-black/40 border-gray-700",
            input: "text-white placeholder-gray-400",
          }}
        />

        <Tabs
          selectedKey={filter}
          onSelectionChange={(key) => setFilter(key as string)}
          size="sm"
          variant="bordered"
          classNames={{
            tabList: "border-gray-700",
            tab: "text-gray-400",
            cursor: "bg-white/10",
          }}
        >
          <Tab key="all" title="すべて" />
          <Tab key="expired" title="期限切れ" />
          <Tab key="warning" title="期限間近" />
          <Tab key="safe" title="安全" />
        </Tabs>
      </div>

      {/* テーブル */}
      <Table
        aria-label="在庫一覧"
        sortDescriptor={sortDescriptor}
        onSortChange={setSortDescriptor}
        classNames={{
          wrapper: "bg-gray-900/80 rounded-xl",
          th: "bg-gray-800 text-white font-semibold",
          td: "text-white",
          tr: "border-b border-gray-700/50 hover:bg-gray-700/50",
        }}
      >
        <TableHeader>
          <TableColumn key="name" allowsSorting>
            商品名
          </TableColumn>
          <TableColumn key="quantity" allowsSorting>
            数量
          </TableColumn>
          <TableColumn key="expiration_date" allowsSorting>
            消費期限
          </TableColumn>
          <TableColumn key="status">状態</TableColumn>
          <TableColumn key="actions">操作</TableColumn>
        </TableHeader>
        <TableBody emptyContent="該当する在庫がありません">
          {filteredAndSortedStocks.map((stock) => {
            const status = getExpirationStatus(stock.expiration_date);
            return (
              <TableRow key={stock.id}>
                <TableCell className="font-medium">{stock.name}</TableCell>
                <TableCell>{stock.quantity}個</TableCell>
                <TableCell>{formatDate(stock.expiration_date)}</TableCell>
                <TableCell>
                  <ExpirationChip status={status} />
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="light"
                      className="text-white"
                      onPress={() => alert(`編集機能は後で実装します: ${stock.name}`)}
                    >
                      編集
                    </Button>
                    <Button
                      size="sm"
                      variant="light"
                      color="danger"
                      onPress={() => alert(`削除機能は後で実装します: ${stock.name}`)}
                    >
                      削除
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};
