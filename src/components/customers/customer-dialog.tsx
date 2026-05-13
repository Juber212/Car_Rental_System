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
import { Textarea } from "@/components/ui/textarea";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  driverLicenseNumber: string;
  driverLicenseImage: string | null;
  notes: string | null;
}

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}

const defaultForm = {
  name: "",
  phone: "",
  email: "",
  driverLicenseNumber: "",
  driverLicenseImage: "",
  notes: "",
};

export function CustomerDialog({ open, onOpenChange, customer }: CustomerDialogProps) {
  const router = useRouter();
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const isEdit = !!customer;

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name,
        phone: customer.phone,
        email: customer.email ?? "",
        driverLicenseNumber: customer.driverLicenseNumber,
        driverLicenseImage: customer.driverLicenseImage ?? "",
        notes: customer.notes ?? "",
      });
    } else {
      setForm(defaultForm);
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const result = isEdit
      ? await updateCustomer(customer!.id, formData)
      : await createCustomer(formData);

    if (result.success) {
      toast.success(isEdit ? "客户信息已更新" : "客户已添加");
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
          <DialogTitle>{isEdit ? "编辑客户" : "添加客户"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "修改客户信息" : "添加新客户到系统中"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="张三"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">手机号</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="13800138000"
                maxLength={11}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">邮箱（选填）</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="example@mail.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="driverLicenseNumber">驾驶证号码</Label>
              <Input
                id="driverLicenseNumber"
                value={form.driverLicenseNumber}
                onChange={(e) =>
                  setForm({ ...form, driverLicenseNumber: e.target.value })
                }
                placeholder="110101199001011234"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="driverLicenseImage">驾驶证照片 URL（选填）</Label>
              <Input
                id="driverLicenseImage"
                value={form.driverLicenseImage}
                onChange={(e) =>
                  setForm({ ...form, driverLicenseImage: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>

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
