import { Car, ClipboardList, DollarSign, CalendarCheck } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";

async function getDashboardStats() {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [todayOrders, activeRentals, availableCars, monthlyRevenue, statusCounts] =
    await Promise.all([
      prisma.rental.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.rental.count({ where: { status: "ACTIVE" } }),
      prisma.car.count({ where: { status: "AVAILABLE" } }),
      prisma.rental.aggregate({
        where: {
          startDate: { gte: monthStart },
          status: { in: ["ACTIVE", "COMPLETED"] },
        },
        _sum: { totalCost: true },
      }),
      Promise.all([
        prisma.car.count({ where: { status: "AVAILABLE" } }),
        prisma.car.count({ where: { status: "RESERVED" } }),
        prisma.car.count({ where: { status: "RENTED" } }),
        prisma.car.count({ where: { status: "MAINTENANCE" } }),
      ]),
    ]);

  return {
    todayOrders,
    activeRentals,
    availableCars,
    monthlyRevenue: monthlyRevenue._sum.totalCost ?? 0,
    statusCounts: {
      available: statusCounts[0],
      reserved: statusCounts[1],
      rented: statusCounts[2],
      maintenance: statusCounts[3],
    },
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
  RESERVED: "已预约",
  ACTIVE: "进行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

const statusBadgeClass: Record<string, string> = {
  RESERVED: "bg-amber-50 text-amber-700",
  ACTIVE: "bg-emerald-50 text-emerald-700",
  COMPLETED: "bg-blue-50 text-blue-700",
  CANCELLED: "bg-red-50 text-red-700",
};

const carStatusConfig = [
  { key: "available", label: "可租", color: "bg-emerald-50 text-emerald-700", icon: "●" },
  { key: "reserved", label: "已预约", color: "bg-amber-50 text-amber-700", icon: "●" },
  { key: "rented", label: "已租出", color: "bg-blue-50 text-blue-700", icon: "●" },
  { key: "maintenance", label: "维修中", color: "bg-red-50 text-red-700", icon: "●" },
];

export default async function DashboardPage() {
  const [stats, recentRentals] = await Promise.all([
    getDashboardStats(),
    getRecentRentals(),
  ]);

  const totalCars =
    stats.statusCounts.available +
    stats.statusCounts.reserved +
    stats.statusCounts.rented +
    stats.statusCounts.maintenance;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">仪表盘</h1>
        <p className="text-sm text-muted-foreground">租赁业务概览</p>
      </div>

      {/* Top Stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="今日订单数"
          value={String(stats.todayOrders)}
          description="今日创建"
          icon={CalendarCheck}
        />
        <StatsCard
          title="当前出租车辆"
          value={String(stats.activeRentals)}
          description="进行中"
          icon={ClipboardList}
        />
        <StatsCard
          title="可用车辆"
          value={String(stats.availableCars)}
          description="待出租"
          icon={Car}
        />
        <StatsCard
          title="本月收入"
          value={`¥${Number(stats.monthlyRevenue).toLocaleString()}`}
          description="当月累计"
          icon={DollarSign}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Rentals */}
        <div className="lg:col-span-2 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <h2 className="text-sm font-medium">最近订单</h2>
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
                  <th className="px-6 py-3 font-medium">客户</th>
                  <th className="px-6 py-3 font-medium">车辆</th>
                  <th className="px-6 py-3 font-medium">租期</th>
                  <th className="px-6 py-3 font-medium">金额</th>
                  <th className="px-6 py-3 font-medium">状态</th>
                </tr>
              </thead>
              <tbody>
                {recentRentals.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-sm text-muted-foreground">
                      暂无订单
                    </td>
                  </tr>
                ) : (
                  recentRentals.map((rental) => (
                    <tr
                      key={rental.id}
                      className="border-b border-border text-sm last:border-0"
                    >
                      <td className="px-6 py-3 font-medium">
                        {rental.customer.name}
                      </td>
                      <td className="px-6 py-3">
                        <div>{rental.car.brand} {rental.car.model}</div>
                        <div className="text-xs text-muted-foreground">
                          {rental.car.plate}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-muted-foreground">
                        {rental.startDate.toLocaleDateString("zh-CN")} —{" "}
                        {rental.endDate.toLocaleDateString("zh-CN")}
                      </td>
                      <td className="px-6 py-3 tabular-nums">
                        ¥{Number(rental.totalCost).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <Badge
                          variant="outline"
                          className={statusBadgeClass[rental.status] ?? statusBadgeClass.RESERVED}
                        >
                          {statusLabels[rental.status]}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Vehicle Status Breakdown + Quick Actions */}
        <div className="space-y-4">
          {/* Vehicle Status */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-muted-foreground">
              车辆状态 — 共 {totalCars} 辆
            </h2>
            <div className="mt-4 space-y-3">
              {carStatusConfig.map((item) => {
                const count =
                  stats.statusCounts[item.key as keyof typeof stats.statusCounts];
                const pct = totalCars > 0 ? (count / totalCars) * 100 : 0;

                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="flex items-center gap-1.5">
                        <span className={item.color}>{item.icon}</span>
                        {item.label}
                      </span>
                      <span className="tabular-nums font-medium">{count}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary">
                      <div
                        className={`h-full rounded-full ${item.color.replace("text-", "bg-")}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h2 className="text-sm font-medium text-muted-foreground">快速操作</h2>
            <div className="mt-3 flex flex-col gap-2">
              <a
                href="/rentals"
                className="rounded-md bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
              >
                + 新建租赁
              </a>
              <a
                href="/cars"
                className="rounded-md bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
              >
                + 添加车辆
              </a>
              <a
                href="/customers"
                className="rounded-md bg-secondary px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary/80"
              >
                + 添加客户
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
