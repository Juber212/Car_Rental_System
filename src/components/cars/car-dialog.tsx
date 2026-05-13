"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCar, updateCar } from "@/lib/actions/cars";

interface Car {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  dailyRate: number;
  status: string;
}

interface CarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  car?: Car | null;
}

const statuses = [
  { value: "AVAILABLE", label: "可租" },
  { value: "RESERVED", label: "已预约" },
  { value: "RENTED", label: "已租出" },
  { value: "MAINTENANCE", label: "维修中" },
];

const defaultForm = {
  brand: "",
  model: "",
  year: new Date().getFullYear(),
  plate: "",
  color: "",
  dailyRate: 0,
  status: "AVAILABLE" as string,
};

export function CarDialog({ open, onOpenChange, car }: CarDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEdit = !!car;

  useEffect(() => {
    if (car) {
      setForm({
        brand: car.brand,
        model: car.model,
        year: car.year,
        plate: car.plate,
        color: car.color,
        dailyRate: Number(car.dailyRate),
        status: car.status,
      });
    } else {
      setForm(defaultForm);
    }
  }, [car, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const result = isEdit ? await updateCar(car!.id, formData) : await createCar(formData);

    if (result.success) {
      toast.success(isEdit ? "车辆信息已更新" : "车辆已添加");
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
          <DialogTitle>{isEdit ? "编辑车辆" : "添加车辆"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改车辆信息" : "添加一辆新车到系统中"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="brand">品牌</Label>
              <Input
                id="brand"
                value={form.brand}
                onChange={(e) => setForm({ ...form, brand: e.target.value })}
                placeholder="Toyota"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="model">型号</Label>
              <Input
                id="model"
                value={form.model}
                onChange={(e) => setForm({ ...form, model: e.target.value })}
                placeholder="Camry"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">年份</Label>
              <Input
                id="year"
                type="number"
                value={form.year}
                onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
                min={2000}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plate">车牌号</Label>
              <Input
                id="plate"
                value={form.plate}
                onChange={(e) => setForm({ ...form, plate: e.target.value })}
                placeholder="京A12345"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="color">颜色</Label>
              <Input
                id="color"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                placeholder="白色"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dailyRate">日租价格 (¥)</Label>
              <Input
                id="dailyRate"
                type="number"
                value={form.dailyRate || ""}
                onChange={(e) => setForm({ ...form, dailyRate: Number(e.target.value) })}
                min={1}
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">状态</Label>
            <Select
              value={form.status}
              onValueChange={(value) => setForm({ ...form, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
