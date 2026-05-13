"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2, History } from "lucide-react";
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { deleteCustomer } from "@/lib/actions/customers";
import { CustomerDialog } from "./customer-dialog";

interface RentalRecord {
  id: string;
  startDate: string;
  endDate: string;
  status: string;
  totalCost: number;
  car: { brand: string; model: string; plate: string };
}

export interface CustomerData {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  driverLicenseNumber: string;
  driverLicenseImage: string | null;
  notes: string | null;
  rentals: RentalRecord[];
}

const rentalStatusMap: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "进行中", className: "bg-emerald-50 text-emerald-700" },
  COMPLETED: { label: "已完成", className: "bg-blue-50 text-blue-700" },
  CANCELLED: { label: "已取消", className: "bg-red-50 text-red-700" },
};

interface CustomerTableProps {
  customers: CustomerData[];
}

export function CustomerTable({ customers }: CustomerTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerData | null>(null);
  const [historyCustomer, setHistoryCustomer] = useState<CustomerData | null>(null);

  const filtered = customers.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.phone.includes(search) ||
      c.driverLicenseNumber.includes(search)
  );

  const handleEdit = (customer: CustomerData) => {
    setEditingCustomer(customer);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCustomer(null);
    setDialogOpen(true);
  };

  const handleDelete = async (customer: CustomerData) => {
    if (!confirm(`确认删除客户「${customer.name}」？`)) return;

    const result = await deleteCustomer(customer.id);
    if (result.success) {
      toast.success(`已删除 ${customer.name}`);
      router.refresh();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="搜索姓名、手机号、驾驶证..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="size-4" />
          添加客户
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>姓名</TableHead>
              <TableHead>手机号</TableHead>
              <TableHead>邮箱</TableHead>
              <TableHead>驾驶证号码</TableHead>
              <TableHead>备注</TableHead>
              <TableHead className="w-28">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                  {search ? "没有匹配的客户" : "暂无客户，点击「添加客户」开始"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.phone}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {customer.email || "—"}
                  </TableCell>
                  <TableCell>{customer.driverLicenseNumber}</TableCell>
                  <TableCell className="max-w-40 truncate text-muted-foreground">
                    {customer.notes || "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        title="历史订单"
                        onClick={() => setHistoryCustomer(customer)}
                      >
                        <History className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8"
                        onClick={() => handleEdit(customer)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(customer)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Dialog */}
      <CustomerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customer={editingCustomer}
      />

      {/* Rental History Sheet */}
      <Sheet
        open={!!historyCustomer}
        onOpenChange={() => setHistoryCustomer(null)}
      >
        <SheetContent className="w-96 sm:max-w-md">
          <SheetHeader>
            <SheetTitle>历史订单 — {historyCustomer?.name}</SheetTitle>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {historyCustomer?.rentals.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无租赁记录</p>
            ) : (
              historyCustomer?.rentals.map((rental) => {
                const status = rentalStatusMap[rental.status] ?? rentalStatusMap.ACTIVE;
                return (
                  <div
                    key={rental.id}
                    className="rounded-lg border border-border p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">
                        {rental.car.brand} {rental.car.model}
                      </span>
                      <Badge className={status.className}>{status.label}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {rental.car.plate}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {new Date(rental.startDate).toLocaleDateString("zh-CN")} —{" "}
                        {new Date(rental.endDate).toLocaleDateString("zh-CN")}
                      </span>
                      <span className="font-medium tabular-nums">
                        ¥{Number(rental.totalCost).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
