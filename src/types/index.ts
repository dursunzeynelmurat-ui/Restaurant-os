export type UserRole =
  | "OWNER"
  | "MANAGER"
  | "WAITER"
  | "KITCHEN"
  | "BAR"
  | "RUNNER"
  | "CASHIER";

export type TableStatus =
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "NEEDS_CLEANING"
  | "BLOCKED"
  | "BILL_REQUESTED"
  | "PAID"
  | "AWAITING_RUNNER";

export type StationType = "KITCHEN" | "BAR" | "PASS";
export type MenuItemStation = "KITCHEN" | "BAR";

export type OrderStatus =
  | "OPEN"
  | "SENT"
  | "PARTIALLY_READY"
  | "READY"
  | "SERVED"
  | "CLOSED"
  | "VOIDED";

export type OrderItemStatus =
  | "PENDING"
  | "SENT"
  | "IN_PROGRESS"
  | "READY"
  | "SERVED"
  | "VOIDED";

export type TicketStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "VOIDED";
export type TicketItemStatus = "PENDING" | "IN_PROGRESS" | "DONE" | "VOIDED";
export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "MIXED";
export type PaymentStatus = "PENDING" | "COMPLETED" | "VOIDED";

export interface Business {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  timezone: string;
}

export interface User {
  id: string;
  business_id: string;
  email: string | null;
  name: string;
  pin: string | null;
  role: UserRole;
  active: boolean;
}

export interface Area {
  id: string;
  branch_id: string;
  name: string;
  sort_order: number;
}

export interface Table {
  id: string;
  branch_id: string;
  area_id: string;
  number: string;
  capacity: number;
  status: TableStatus;
  updated_at: string;
  area?: Area;
  active_order?: Order | null;
}

export interface Station {
  id: string;
  branch_id: string;
  name: string;
  type: StationType;
  active: boolean;
}

export interface MenuCategory {
  id: string;
  branch_id: string;
  name: string;
  sort_order: number;
  active: boolean;
  items?: MenuItem[];
}

export interface MenuItem {
  id: string;
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  station: MenuItemStation;
  active: boolean;
  sort_order: number;
  category?: MenuCategory;
  modifier_groups?: MenuItemModifierGroup[];
}

export interface ModifierGroup {
  id: string;
  name: string;
  required: boolean;
  multi_select: boolean;
  min_select: number;
  max_select: number;
  modifiers?: Modifier[];
}

export interface Modifier {
  id: string;
  modifier_group_id: string;
  name: string;
  price_delta: number;
  active: boolean;
}

export interface MenuItemModifierGroup {
  menu_item_id: string;
  modifier_group_id: string;
  sort_order: number;
  modifier_group?: ModifierGroup;
}

export interface QuickMenuLayout {
  id: string;
  branch_id: string;
  name: string;
  is_default: boolean;
  items?: QuickMenuItem[];
}

export interface QuickMenuItem {
  id: string;
  layout_id: string;
  menu_item_id: string;
  label: string | null;
  color: string | null;
  grid_row: number;
  grid_col: number;
  menu_item?: MenuItem;
}

export interface Order {
  id: string;
  branch_id: string;
  table_id: string;
  waiter_id: string;
  status: OrderStatus;
  covers: number;
  note: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  table?: Table;
  waiter?: User;
  items?: OrderItem[];
  payment?: Payment | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  menu_item_id: string;
  quantity: number;
  unit_price: number;
  note: string | null;
  course: number;
  status: OrderItemStatus;
  sent_at: string | null;
  ready_at: string | null;
  served_at: string | null;
  menu_item?: MenuItem;
  modifiers?: OrderItemModifier[];
}

export interface OrderItemModifier {
  id: string;
  order_item_id: string;
  modifier_id: string;
  price_delta: number;
  modifier?: Modifier;
}

export interface Ticket {
  id: string;
  order_id: string;
  station_id: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  done_at: string | null;
  order?: Order;
  station?: Station;
  items?: TicketItem[];
}

export interface TicketItem {
  id: string;
  ticket_id: string;
  order_item_id: string;
  status: TicketItemStatus;
  done_at: string | null;
  order_item?: OrderItem;
}

export interface Payment {
  id: string;
  order_id: string;
  branch_id: string;
  amount: number;
  tip: number;
  method: PaymentMethod;
  status: PaymentStatus;
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  business_id: string;
  branch_id: string;
  action: string;
  entity: string;
  entity_id: string;
  payload: Record<string, unknown> | null;
  reason: string | null;
  created_at: string;
}

export interface SessionUser {
  id: string;
  name: string;
  email: string | null;
  role: UserRole;
  businessId: string;
  branchId: string;
}

export interface DraftItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  station: MenuItemStation;
  modifiers: { modifierId: string; name: string; priceDelta: number }[];
  note: string;
  color?: string;
}
