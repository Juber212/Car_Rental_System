"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Pencil, CheckCircle, Undo2, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  confirmPickup,
  completeReturn,
  cancelRental,
} from "@/lib/actions/rentals";
import { RentalDialog, type RentalFormData } from "./rental-dialog";

interface SelectOption {
  id: string;
  label: string;
}

export interface RentalData {
  id: string;
  carId: string;
  customerId: string;
  car: { brand: string; model: string; plate: string; dailyRate: number };
  customer: { name: string; phone: string };
  startDate: string;
  endDate: string;
  status: string;
  totalCost: number;
  notes: string | null;
}

const statusMap: Record<string, { label: string; className: string }> = {
  RESERVED: { label: "已预约", className: "bg-amber-50 text-amber-700" },
  ACTIVE: { label: "进行中", className: "bg-emerald-50 text-emerald-700" },
  COMPLETED: { label: "已完成", className: "bg-blue-50 text-blue-700" },
  CANCELLED: { label: "已取消", className: "bg-red-50 text-red-700" },
};

interface RentalTableProps {
  rentals: RentalData[];
  customers: SelectOption[];
  cars: SelectOption[];
}

export function RentalTable({ rentals, customers, cars }: RentalTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<RentalFormData | null>(null);

  const filtered = rentals.filter((r) => {
    const matchSearch =
      r.car.plate.toLowerCase().includes(search.toLowerCase()) ||
      r.car.brand.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.name.toLowerCase().includes(search.toLowerCase()) ||
      r.customer.phone.includes(search);

    const matchStatus = statusFilter === "ALL" || r.status === statusFilter;

    return matchSearch && matchStatus;
  });

  const handleAction = async (
    action: (id: string) => Promise<{ success?: boolean; error?: string }>,
    id: string,
    successMsg: string
  ) => {
    const result = await action(id);
    if (result.success) {
      toast.success(successMsg);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  const handleEdit = (rental: RentalData) => {
    if (rental.status !== "RESERVED" && rental.status !== "ACTIVE") return;
    setEditingRental({
      id: rental.id,
      carId: rental.carId,
      customerId: rental.customerId,
      startDate: rental.startDate,
      endDate: rental.endDate,
      notes: rental.notes,
    });
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingRental(null);
    setDialogOpen(true);
  };

  const statusTabs = [
    { value: "ALL", label: "全部" },
    { value: "RESERVED", label: "已预约" },
    { value: "ACTIVE", label: "进行中" },
    { value: "COMPLETED", label: "已完成" },
    { value: "CANCELLED", label: "已取消" },
  ];

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索车牌、品牌、客户..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="size-4" />
          创建订单
        </Button>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex gap-1 overflow-x-auto">
        {statusTabs.map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? "default" : "ghost"}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
            className="shrink-0"
          >
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>客户</TableHead>
              <TableHead>车辆</TableHead>
              <TableHead>车牌号</TableHead>
              <TableHead>租期</TableHead>
              <TableHead>天数</TableHead>
              <TableHead>金额</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-36">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                  {search || statusFilter !== "ALL"
                    ? "没有匹配的订单"
                    : "暂无订单，点击「创建订单」开始"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((rental) => {
                const status = statusMap[rental.status] ?? statusMap.RESERVED;
                const days =
                  Math.ceil(
                    (new Date(rental.endDate).getTime() -
                      new Date(rental.startDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  ) || 1;

                return (
                  <TableRow key={rental.id}>
                    <TableCell>
                      <div className="font-medium">{rental.customer.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {rental.customer.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      {rental.car.brand} {rental.car.model}
                    </TableCell>
                    <TableCell>{rental.car.plate}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(rental.startDate).toLocaleDateString("zh-CN")}{" "}
                      —{" "}
                      {new Date(rental.endDate).toLocaleDateString("zh-CN")}
                    </TableCell>
                    <TableCell>{days} 天</TableCell>
                    <TableCell className="tabular-nums">
                      ¥{Number(rental.totalCost).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {rental.status === "RESERVED" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-emerald-600"
                              title="确认取车"
                              onClick={() =>
                                handleAction(
                                  confirmPickup,
                                  rental.id,
                                  "已确认取车"
                                )
                              }
                            >
                              <CheckCircle className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="编辑"
                              onClick={() => handleEdit(rental)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              title="取消订单"
                              onClick={() => {
                                if (!confirm("确认取消该订单？")) return;
                                handleAction(
                                  cancelRental,
                                  rental.id,
                                  "订单已取消"
                                );
                              }}
                            >
                              <Ban className="size-4" />
                            </Button>
                          </>
                        )}

                        {rental.status === "ACTIVE" && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-blue-600"
                              title="完成还车"
                              onClick={() =>
                                handleAction(
                                  completeReturn,
                                  rental.id,
                                  "已完成还车"
                                )
                              }
                            >
                              <Undo2 className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              title="编辑"
                              onClick={() => handleEdit(rental)}
                            >
                              <Pencil className="size-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <RentalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        rental={editingRental}
        customers={customers}
        cars={cars}
      />
    </div>
  );
}
