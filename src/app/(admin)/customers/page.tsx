import { prisma } from "@/lib/prisma";
import { CustomerTable } from "@/components/customers/customer-table";

export default async function CustomersPage() {
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      rentals: {
        include: {
          car: { select: { brand: true, model: true, plate: true } },
        },
        orderBy: { startDate: "desc" },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">客户管理</h1>
        <p className="text-sm text-muted-foreground">
          管理所有客户信息，共 {customers.length} 人
        </p>
      </div>

      <CustomerTable customers={JSON.parse(JSON.stringify(customers))} />
    </div>
  );
}
