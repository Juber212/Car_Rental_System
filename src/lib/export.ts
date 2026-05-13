import * as XLSX from "xlsx";

interface ExportRow {
  orderId: string;
  customerName: string;
  customerPhone: string;
  carInfo: string;
  carPlate: string;
  startDate: string;
  endDate: string;
  days: number;
  totalCost: number;
  status: string;
  createdDate: string;
}

const statusLabels: Record<string, string> = {
  RESERVED: "已预约",
  ACTIVE: "进行中",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export function exportToExcel(data: ExportRow[], filename = "rental-orders") {
  const rows = data.map((row) => ({
    "订单号": row.orderId,
    "客户姓名": row.customerName,
    "手机号码": row.customerPhone,
    "车辆": row.carInfo,
    "车牌号": row.carPlate,
    "开始日期": row.startDate,
    "结束日期": row.endDate,
    "天数": row.days,
    "总金额": `¥${row.totalCost.toLocaleString()}`,
    "订单状态": statusLabels[row.status] ?? row.status,
    "创建时间": row.createdDate,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "订单");

  // Auto-fit column widths
  const colWidths = Object.keys(rows[0] ?? {}).map((key) => ({
    wch: Math.max(key.length * 2, 12),
  }));
  ws["!cols"] = colWidths;

  XLSX.writeFile(wb, `${filename}.xlsx`);
}
