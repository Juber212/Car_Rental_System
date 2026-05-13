"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Search, Plus, Pencil, Trash2 } from "lucide-react";
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
import { deleteCar } from "@/lib/actions/cars";
import { CarDialog } from "./car-dialog";

export interface CarData {
  id: string;
  brand: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  dailyRate: number;
  status: string;
}

const statusMap: Record<string, { label: string; className: string }> = {
  AVAILABLE: { label: "可租", className: "bg-emerald-50 text-emerald-700" },
  RESERVED: { label: "已预约", className: "bg-amber-50 text-amber-700" },
  RENTED: { label: "已租出", className: "bg-blue-50 text-blue-700" },
  MAINTENANCE: { label: "维修中", className: "bg-red-50 text-red-700" },
};

interface CarTableProps {
  cars: CarData[];
}

export function CarTable({ cars }: CarTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<CarData | null>(null);

  const filtered = cars.filter(
    (car) =>
      car.brand.toLowerCase().includes(search.toLowerCase()) ||
      car.model.toLowerCase().includes(search.toLowerCase()) ||
      car.plate.toLowerCase().includes(search.toLowerCase())
  );

  const handleEdit = (car: CarData) => {
    setEditingCar(car);
    setDialogOpen(true);
  };

  const handleAdd = () => {
    setEditingCar(null);
    setDialogOpen(true);
  };

  const handleDelete = async (car: CarData) => {
    if (!confirm(`确认删除 ${car.brand} ${car.model}（${car.plate}）？`)) return;

    const result = await deleteCar(car.id);
    if (result.success) {
      toast.success(`已删除 ${car.brand} ${car.model}`);
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
            placeholder="搜索品牌、型号、车牌号..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={handleAdd} size="sm">
          <Plus className="size-4" />
          添加车辆
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>品牌</TableHead>
              <TableHead>型号</TableHead>
              <TableHead>年份</TableHead>
              <TableHead>车牌号</TableHead>
              <TableHead>日租价格</TableHead>
              <TableHead>状态</TableHead>
              <TableHead className="w-24">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                  {search ? "没有匹配的车辆" : "暂无车辆，点击「添加车辆」开始"}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((car) => {
                const status = statusMap[car.status] ?? statusMap.AVAILABLE;
                return (
                  <TableRow key={car.id}>
                    <TableCell className="font-medium">{car.brand}</TableCell>
                    <TableCell>{car.model}</TableCell>
                    <TableCell>{car.year}</TableCell>
                    <TableCell>{car.plate}</TableCell>
                    <TableCell>¥{Number(car.dailyRate).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          onClick={() => handleEdit(car)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive"
                          onClick={() => handleDelete(car)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
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
      <CarDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        car={editingCar}
      />
    </div>
  );
}
