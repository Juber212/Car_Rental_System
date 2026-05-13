import { prisma } from "@/lib/prisma";
import { RentalTable } from "@/components/rentals/rental-table";

export default async function RentalsPage() {
  const [rentals, customers, cars] = await Promise.all([
    prisma.rental.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        car: { select: { brand: true, model: true, plate: true, dailyRate: true } },
        customer: { select: { name: true, phone: true } },
      },
    }),
    prisma.customer.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, phone: true },
    }),
    prisma.car.findMany({
      orderBy: { brand: "asc" },
      select: { id: true, brand: true, model: true, plate: true },
    }),
  ]);

  const customerOptions = customers.map((c) => ({
    id: c.id,
    label: `${c.name} (${c.phone})`,
  }));

  const carOptions = cars.map((c) => ({
    id: c.id,
    label: `${c.brand} ${c.model} (${c.plate})`,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">租赁管理</h1>
        <p className="text-sm text-muted-foreground">
          管理所有租赁订单，共 {rentals.length} 单
        </p>
      </div>

      <RentalTable
        rentals={JSON.parse(JSON.stringify(rentals))}
        customers={customerOptions}
        cars={carOptions}
      />
    </div>
  );
}
