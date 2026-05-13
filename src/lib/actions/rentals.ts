"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { differenceInDays } from "date-fns";
import { prisma } from "@/lib/prisma";

const rentalSchema = z.object({
  carId: z.string().min(1, "请选择车辆"),
  customerId: z.string().min(1, "请选择客户"),
  startDate: z.string().min(1, "请选择开始日期"),
  endDate: z.string().min(1, "请选择结束日期"),
  notes: z.string().optional().or(z.literal("")),
});

type RentalInput = z.infer<typeof rentalSchema>;

/** 检测指定车辆在指定日期范围内是否有冲突订单 */
async function hasConflict(
  carId: string,
  startDate: Date,
  endDate: Date,
  excludeRentalId?: string
) {
  const where: Record<string, unknown> = {
    carId,
    status: { not: "CANCELLED" },
    startDate: { lt: endDate },
    endDate: { gt: startDate },
  };
  if (excludeRentalId) where.id = { not: excludeRentalId };

  const conflicting = await prisma.rental.findFirst({ where });
  return conflicting !== null;
}

/** 根据车辆日租和日期计算总金额 */
async function calcTotalCost(carId: string, startDate: Date, endDate: Date) {
  const car = await prisma.car.findUnique({ where: { id: carId } });
  if (!car) throw new Error("车辆不存在");
  const days = differenceInDays(endDate, startDate) || 1;
  return days * Number(car.dailyRate);
}

// ─── 创建订单 ───────────────────────────────────────

export async function createRental(formData: FormData) {
  const raw = Object.fromEntries(formData.entries()) as unknown as RentalInput;
  const parsed = rentalSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { carId, customerId, startDate: sd, endDate: ed, notes } = parsed.data;
  const startDate = new Date(sd);
  const endDate = new Date(ed);

  if (endDate <= startDate) {
    return { error: "结束日期必须晚于开始日期" };
  }

  if (await hasConflict(carId, startDate, endDate)) {
    return { error: "该车辆在所选时间段已被预约或出租，请换个时间段或车辆" };
  }

  try {
    const totalCost = await calcTotalCost(carId, startDate, endDate);

    await prisma.rental.create({
      data: {
        carId,
        customerId,
        startDate,
        endDate,
        totalCost,
        notes: notes || null,
        status: "RESERVED",
      },
    });

    await prisma.car.update({ where: { id: carId }, data: { status: "RESERVED" } });
    revalidatePath("/rentals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "创建订单失败，请重试" };
  }
}

// ─── 编辑订单 ───────────────────────────────────────

export async function updateRental(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries()) as unknown as RentalInput;
  const parsed = rentalSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const { carId, customerId, startDate: sd, endDate: ed, notes } = parsed.data;
  const startDate = new Date(sd);
  const endDate = new Date(ed);

  if (endDate <= startDate) {
    return { error: "结束日期必须晚于开始日期" };
  }

  if (await hasConflict(carId, startDate, endDate, id)) {
    return { error: "该车辆在所选时间段已被预约或出租" };
  }

  try {
    const totalCost = await calcTotalCost(carId, startDate, endDate);

    await prisma.rental.update({
      where: { id },
      data: {
        carId,
        customerId,
        startDate,
        endDate,
        totalCost,
        notes: notes || null,
      },
    });

    revalidatePath("/rentals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "更新订单失败，请重试" };
  }
}

// ─── 确认取车 ───────────────────────────────────────

export async function confirmPickup(id: string) {
  try {
    const rental = await prisma.rental.update({
      where: { id },
      data: {
        status: "ACTIVE",
        actualPickupDate: new Date(),
      },
    });

    await prisma.car.update({
      where: { id: rental.carId },
      data: { status: "RENTED" },
    });

    revalidatePath("/rentals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "操作失败，请重试" };
  }
}

// ─── 完成还车 ───────────────────────────────────────

export async function completeReturn(id: string) {
  try {
    const rental = await prisma.rental.update({
      where: { id },
      data: {
        status: "COMPLETED",
        actualReturnDate: new Date(),
      },
    });

    await prisma.car.update({
      where: { id: rental.carId },
      data: { status: "AVAILABLE" },
    });

    revalidatePath("/rentals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "操作失败，请重试" };
  }
}

// ─── 取消订单（软删除） ──────────────────────────────

export async function cancelRental(id: string) {
  try {
    const rental = await prisma.rental.update({
      where: { id },
      data: { status: "CANCELLED" },
    });

    await prisma.car.update({
      where: { id: rental.carId },
      data: { status: "AVAILABLE" },
    });

    revalidatePath("/rentals");
    revalidatePath("/dashboard");
    return { success: true };
  } catch {
    return { error: "取消失败，请重试" };
  }
}
