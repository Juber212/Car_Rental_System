import { prisma } from "@/lib/prisma";
import { CarTable } from "@/components/cars/car-table";

export default async function CarsPage() {
  const cars = await prisma.car.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">车辆管理</h1>
        <p className="text-sm text-muted-foreground">
          管理所有车辆信息，共 {cars.length} 辆
        </p>
      </div>

      <CarTable cars={JSON.parse(JSON.stringify(cars))} />
    </div>
  );
}
