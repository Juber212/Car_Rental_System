import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.rental.deleteMany();
  await prisma.car.deleteMany();
  await prisma.customer.deleteMany();

  // Seed cars — statuses will be updated by rental creation
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
        status: "AVAILABLE",
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

  // Seed rentals covering all 4 statuses
  // 1. ACTIVE rental — 张伟租 Passat（进行中）
  await prisma.rental.create({
    data: {
      carId: cars[2].id,
      customerId: customers[0].id,
      startDate: new Date("2026-05-10"),
      endDate: new Date("2026-05-17"),
      totalCost: 2100,
      status: "ACTIVE",
      actualPickupDate: new Date("2026-05-10"),
    },
  });
  await prisma.car.update({ where: { id: cars[2].id }, data: { status: "RENTED" } });

  // 2. RESERVED rental — 李娜预约 Camry（已预约，待取车）
  await prisma.rental.create({
    data: {
      carId: cars[0].id,
      customerId: customers[1].id,
      startDate: new Date("2026-05-20"),
      endDate: new Date("2026-05-23"),
      totalCost: 1050,
      status: "RESERVED",
    },
  });
  await prisma.car.update({ where: { id: cars[0].id }, data: { status: "RESERVED" } });

  // 3. COMPLETED rental — 王磊租 Accord（历史订单）
  await prisma.rental.create({
    data: {
      carId: cars[1].id,
      customerId: customers[2].id,
      startDate: new Date("2026-04-01"),
      endDate: new Date("2026-04-03"),
      totalCost: 640,
      status: "COMPLETED",
      actualPickupDate: new Date("2026-04-01"),
      actualReturnDate: new Date("2026-04-03"),
    },
  });

  // 4. CANCELLED rental — 张伟租 BMW（已取消）
  await prisma.rental.create({
    data: {
      carId: cars[3].id,
      customerId: customers[0].id,
      startDate: new Date("2026-05-15"),
      endDate: new Date("2026-05-16"),
      totalCost: 600,
      status: "CANCELLED",
    },
  });

  console.log("Seed data created:");
  console.log(`  ${cars.length} cars`);
  console.log(`  ${customers.length} customers`);
  console.log("  4 rentals (1 ACTIVE, 1 RESERVED, 1 COMPLETED, 1 CANCELLED)");
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
