"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createRental, updateRental } from "@/lib/actions/rentals";

interface SelectOption {
  id: string;
  label: string;
}

export interface RentalFormData {
  id: string;
  carId: string;
  customerId: string;
  startDate: string;
  endDate: string;
  notes: string | null;
}

interface RentalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rental?: RentalFormData | null;
  customers: SelectOption[];
  cars: SelectOption[];
}

const defaultForm = {
  carId: "",
  customerId: "",
  startDate: "",
  endDate: "",
  notes: "",
};

export function RentalDialog({
  open,
  onOpenChange,
  rental,
  customers,
  cars,
}: RentalDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEdit = !!rental;

  const days =
    form.startDate && form.endDate
      ? differenceInDays(new Date(form.endDate), new Date(form.startDate)) || 1
      : 0;

  useEffect(() => {
    if (rental) {
      setForm({
        carId: rental.carId,
        customerId: rental.customerId,
        startDate: rental.startDate.split("T")[0],
        endDate: rental.endDate.split("T")[0],
        notes: rental.notes ?? "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [rental, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const result = isEdit
      ? await updateRental(rental!.id, formData)
      : await createRental(formData);

    if (result.success) {
      toast.success(isEdit ? "订单已更新" : "订单已创建");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error);
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "编辑订单" : "创建订单"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改租赁订单信息" : "创建新的租赁订单"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customerId">客户</Label>
            <Select
              value={form.customerId}
              onValueChange={(value) =>
                setForm({ ...form, customerId: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择客户..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="carId">车辆</Label>
            <Select
              value={form.carId}
              onValueChange={(value) => setForm({ ...form, carId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择车辆..." />
              </SelectTrigger>
              <SelectContent>
                {cars.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">开始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) =>
                  setForm({ ...form, startDate: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">结束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) =>
                  setForm({ ...form, endDate: e.target.value })
                }
                min={form.startDate || undefined}
                required
              />
            </div>
          </div>

          {days > 0 && (
            <div className="rounded-md bg-secondary p-3 text-sm">
              <span className="text-muted-foreground">租赁天数：</span>
              <span className="font-medium">{days} 天</span>
              <span className="text-muted-foreground ml-4">
                （金额提交时自动计算）
              </span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">备注（选填）</Label>
            <Textarea
              id="notes"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="备注信息..."
              rows={2}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "保存中..." : "保存"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
