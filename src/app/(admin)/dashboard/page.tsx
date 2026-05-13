import { Car, Users, ClipboardList, Wrench } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { prisma } from "@/lib/prisma";

async function getDashboardStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalCars, availableCars, activeRentals, totalCustomers, monthlyRevenue] =
    await Promise.all([
      prisma.car.count(),
      prisma.car.count({ where: { status: "AVAILABLE" } }),
      prisma.rental.count({ where: { status: "ACTIVE" } }),
      prisma.customer.count(),
      prisma.rental.aggregate({
        where: {
          startDate: { gte: monthStart },
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
        _sum: { totalCost: true },
      }),
    ]);

  return {
    totalCars,
    availableCars,
    activeRentals,
    totalCustomers,
    monthlyRevenue: monthlyRevenue._sum.totalCost ?? 0,
  };
}

async function getRecentRentals() {
  return prisma.rental.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: {
      car: { select: { brand: true, model: true, plate: true } },
      customer: { select: { name: true } },
    },
  });
}

const statusLabels: Record<string, string> = {
  ACTIVE: "进行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export default async function DashboardPage() {
  const [stats, recentRentals] = await Promise.all([
    getDashboardStats(),
    getRecentRentals(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">仪表盘</h1>
        <p className="text-sm text-muted-foreground">租赁业务概览</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="车辆总数"
          value={String(stats.totalCars)}
          description="在库车辆"
          icon={Car}
        />
        <StatsCard
          title="可租车辆"
          value={String(stats.availableCars)}
          description="待出租"
          icon={Wrench}
        />
        <StatsCard
          title="进行中租赁"
          value={String(stats.activeRentals)}
          description="当前租出"
          icon={ClipboardList}
        />
        <StatsCard
          title="客户总数"
          value={String(stats.totalCustomers)}
          description="已注册客户"
          icon={Users}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Monthly Revenue */}
        <div className="lg:col-span-2">
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-muted-foreground">
              本月收入
            </h2>
            <p className="mt-1 text-3xl font-semibold tabular-nums">
              ¥{Number(stats.monthlyRevenue).toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">当月累计</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="rounded-lg border border-border bg-card p-6">
          <h2 className="text-sm font-medium text-muted-foreground">快速操作</h2>
          <div className="mt-3 flex flex-col gap-2">
            <a
              href="/rentals/new"
              className="rounded-md bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
            >
              + 新建租赁
            </a>
            <a
              href="/cars/new"
              className="rounded-md bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
            >
              + 添加车辆
            </a>
            <a
              href="/customers/new"
              className="rounded-md bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
            >
              + 添加客户
            </a>
          </div>
        </div>
      </div>

      {/* Recent Rentals */}
      <div className="rounded-lg border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-sm font-medium">最近租赁</h2>
          <a
            href="/rentals"
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            查看全部 →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="px-6 py-3 font-medium">车辆</th>
                <th className="px-6 py-3 font-medium">客户</th>
                <th className="px-6 py-3 font-medium">租期</th>
                <th className="px-6 py-3 font-medium">金额</th>
                <th className="px-6 py-3 font-medium">状态</th>
              </tr>
            </thead>
            <tbody>
              {recentRentals.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    暂无租赁记录
                  </td>
                </tr>
              ) : (
                recentRentals.map((rental) => (
                  <tr
                    key={rental.id}
                    className="border-b border-border text-sm last:border-0"
                  >
                    <td className="px-6 py-3">
                      <div className="font-medium">
                        {rental.car.brand} {rental.car.model}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rental.car.plate}
                      </div>
                    </td>
                    <td className="px-6 py-3">{rental.customer.name}</td>
                    <td className="px-6 py-3 text-muted-foreground">
                      {rental.startDate.toLocaleDateString("zh-CN")} —{" "}
                      {rental.endDate.toLocaleDateString("zh-CN")}
                    </td>
                    <td className="px-6 py-3 tabular-nums">
                      ¥{Number(rental.totalCost).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          rental.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : rental.status === "COMPLETED"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-red-50 text-red-700"
                        }`}
                      >
                        {statusLabels[rental.status]}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
