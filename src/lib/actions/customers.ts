"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const customerSchema = z.object({
  name: z.string().min(1, "姓名不能为空"),
  phone: z
    .string()
    .min(1, "手机号不能为空")
    .regex(/^1[3-9]\d{9}$/, "请输入有效的手机号"),
  email: z.string().optional().or(z.literal("")),
  driverLicenseNumber: z.string().min(1, "驾驶证号码不能为空"),
  driverLicenseImage: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
});

type CustomerInput = z.infer<typeof customerSchema>;

export async function createCustomer(formData: FormData) {
  const raw = Object.fromEntries(formData.entries()) as unknown as CustomerInput;
  const parsed = customerSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const data = {
    ...parsed.data,
    email: parsed.data.email || null,
    driverLicenseImage: parsed.data.driverLicenseImage || null,
    notes: parsed.data.notes || null,
  };

  try {
    await prisma.customer.create({ data });
    revalidatePath("/customers");
    return { success: true };
  } catch {
    return { error: "创建失败，手机号或驾驶证号码可能已存在" };
  }
}

export async function updateCustomer(id: string, formData: FormData) {
  const raw = Object.fromEntries(formData.entries()) as unknown as CustomerInput;
  const parsed = customerSchema.safeParse(raw);

  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const data = {
    ...parsed.data,
    email: parsed.data.email || null,
    driverLicenseImage: parsed.data.driverLicenseImage || null,
    notes: parsed.data.notes || null,
  };

  try {
    await prisma.customer.update({ where: { id }, data });
    revalidatePath("/customers");
    return { success: true };
  } catch {
    return { error: "更新失败，手机号或驾驶证号码可能已存在" };
  }
}

export async function deleteCustomer(id: string) {
  try {
    await prisma.customer.delete({ where: { id } });
    revalidatePath("/customers");
    return { success: true };
  } catch {
    return { error: "删除失败，该客户可能存在关联租赁" };
  }
}
