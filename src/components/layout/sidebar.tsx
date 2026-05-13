"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Car,
  Users,
  ClipboardList,
} from "lucide-react";

const navigation = [
  { name: "仪表盘", href: "/dashboard", icon: LayoutDashboard },
  { name: "车辆管理", href: "/cars", icon: Car },
  { name: "客户管理", href: "/customers", icon: Users },
  { name: "租赁管理", href: "/rentals", icon: ClipboardList },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-60 lg:flex-col">
      <div className="flex grow flex-col gap-y-4 border-r border-border bg-card px-4">
        {/* Logo */}
        <div className="flex h-14 items-center gap-2 px-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Car className="size-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold">租车系统</span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border py-3">
          <p className="px-3 text-xs text-muted-foreground">
            Car Rental v0.1
          </p>
        </div>
      </div>
    </aside>
  );
}
