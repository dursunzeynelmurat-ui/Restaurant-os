import TableGrid from "@/components/tables/TableGrid";

export default function CashierPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 pb-2">
        <h2 className="text-lg font-bold text-white mb-1">Open Tables</h2>
        <p className="text-sm text-gray-400">Select a table to view the bill</p>
      </div>
      <TableGrid
        linkBase="/cashier/table"
        filterStatuses={["OCCUPIED", "AWAITING_RUNNER", "BILL_REQUESTED", "NEEDS_CLEANING"]}
      />
    </div>
  );
}
