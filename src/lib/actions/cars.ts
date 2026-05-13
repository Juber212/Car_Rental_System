"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const carSchema = z.object({
  brand: z.string().min(1, "品牌不能为空"),
  model: z.string().min(1, "型号不能为空"),
  year: z.coerce.number().int().min(2000, "年份需 ≥ 2000"),
  plate: z.string().min(1, "车牌号不能为空"),
  color: z.string().min(1, "颜色不能为空"),
  dailyRate: z.coerce.number().positive("日租价格需 > 0"),
  status: z.enum(["AVAILABLE", "RESERVED", "RENTED", "MAINTENANCE"]),
});

type CarInput = z.infer<typeof carSchema>;

export async function createCar(formData: FormData) {
  const raw = Object.fromEntries(formData.entries()) as unknown as CarInput;
  const parsed = carSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    await prisma.car.create({ data: parsed.data });
    revalidatePath("/cars");
    return { success: true };
  } catch {
    return { error: "创建失败，车牌号可能已存在" };
  }
}

export async function updateCar(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries()) as unknown as CarInput;
  const parsed = carSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  try {
    await prisma.car.update({ where: { id }, data: parsed.data });
    revalidatePath("/cars");
    return { success: true };
  } catch {
    return { error: "更新失败，车牌号可能已存在" };
  }
}

export async function deleteCar(id: string) {
  try {
    await prisma.car.delete({ where: { id } });
    revalidatePath("/cars");
    return { success: true };
  } catch {
    return { error: "删除失败，该车辆可能存在关联租赁" };
  }
}
