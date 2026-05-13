import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.rental.deleteMany();
  await prisma.car.deleteMany();
  await prisma.customer.deleteMany();

  // Seed cars
  const cars = await Promise.all([
    prisma.car.create({
      data: {
        brand: "Toyota",
        model: "Camry",
        year: 2024,
        plate: "京A12345",
        color: "White",
        dailyRate: 350,
        status: "AVAILABLE",
      },
    }),
    prisma.car.create({
      data: {
        brand: "Honda",
        model: "Accord",
        year: 2023,
        plate: "京A12346",
        color: "Black",
        dailyRate: 320,
        status: "AVAILABLE",
      },
    }),
    prisma.car.create({
      data: {
        brand: "Volkswagen",
        model: "Passat",
        year: 2024,
        plate: "京A12347",
        color: "Silver",
        dailyRate: 300,
        status: "RENTED",
      },
    }),
    prisma.car.create({
      data: {
        brand: "BMW",
        model: "3 Series",
        year: 2024,
        plate: "京A12348",
        color: "Blue",
        dailyRate: 600,
        status: "AVAILABLE",
      },
    }),
    prisma.car.create({
      data: {
        brand: "Mercedes-Benz",
        model: "C-Class",
        year: 2023,
        plate: "京A12349",
        color: "White",
        dailyRate: 650,
        status: "MAINTENANCE",
      },
    }),
  ]);

  // Seed customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: "张伟",
        phone: "13800138001",
        email: "zhangwei@example.com",
        driverLicenseNumber: "110101199001011234",
        notes: "老客户，信誉良好",
      },
    }),
    prisma.customer.create({
      data: {
        name: "李娜",
        phone: "13800138002",
        email: "lina@example.com",
        driverLicenseNumber: "110101199002021234",
        driverLicenseImage: "https://example.com/licenses/lina.jpg",
      },
    }),
    prisma.customer.create({
      data: {
        name: "王磊",
        phone: "13800138003",
        driverLicenseNumber: "110101199003031234",
        notes: "需确认驾照有效期",
      },
    }),
  ]);

  // Seed a rental
  await prisma.rental.create({
    data: {
      carId: cars[2].id, // The Passat that is RENTED
      customerId: customers[0].id,
      startDate: new Date("2026-05-10"),
      endDate: new Date("2026-05-17"),
      totalCost: 2100,
      status: "ACTIVE",
    },
  });

  console.log("Seed data created:");
  console.log(`  ${cars.length} cars`);
  console.log(`  ${customers.length} customers`);
  console.log("  1 rental");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
