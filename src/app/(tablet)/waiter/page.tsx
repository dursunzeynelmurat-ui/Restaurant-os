import TableGrid from "@/components/tables/TableGrid";

export default function WaiterPage() {
  return (
    <div className="h-full overflow-y-auto">
      <TableGrid linkBase="/waiter/table" />
    </div>
  );
}
