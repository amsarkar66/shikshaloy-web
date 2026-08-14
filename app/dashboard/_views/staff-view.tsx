import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import {
  BookOpen, BedDouble, IndianRupee, Users, CalendarOff, UserPlus,
  Package, ChevronRight, MessageSquare, FolderOpen, Megaphone,
  AlertTriangle, Clock, Wallet, Briefcase,
} from "lucide-react";
import { supabaseAdmin } from "@/lib/supabase/service";
import { getCurrentSchoolIdOrThrow } from "@/lib/supabase/school-context";
import { getStaffContext } from "@/lib/staff/context";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function formatHeaderDate() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

function formatCurrency(n: number) {
  return `₹${n.toLocaleString("en-IN")}`;
}

const TEMPLATE_LABEL: Record<string, string> = {
  librarian: "Librarian",
  warden: "Warden",
  accountant: "Accountant",
  hr_manager: "HR Manager",
  receptionist: "Receptionist",
  lab_assistant: "Lab Assistant",
};

interface Stat { label: string; value: string; sub: string; icon: React.ElementType; accent: string }

function StatCard({ stat }: { stat: Stat }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-4 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.accent}`}>
          <stat.icon className="h-4 w-4" />
        </div>
        <span className="text-[11px] text-gray-400 dark:text-zinc-500 text-right">{stat.sub}</span>
      </div>
      <div>
        <p className="text-2xl font-bold tracking-tight text-gray-900 dark:text-zinc-50">{stat.value}</p>
        <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-zinc-400">{stat.label}</p>
      </div>
    </div>
  );
}

interface Row { title: string; subtitle: string; badge?: { label: string; cls: string } }

function ListPanel({ title, href, hrefLabel, rows, emptyLabel }: {
  title: string; href: string; hrefLabel: string; rows: Row[]; emptyLabel: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-900 dark:text-zinc-50">{title}</p>
        <Link href={href} className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 hover:underline">
          {hrefLabel} <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400 dark:text-zinc-500">{emptyLabel}</p>
      ) : (
        <div className="divide-y divide-gray-100 dark:divide-zinc-700/50">
          {rows.map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-zinc-100 truncate">{r.title}</p>
                <p className="text-xs text-gray-400 dark:text-zinc-500 truncate">{r.subtitle}</p>
              </div>
              {r.badge && (
                <span className={`shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${r.badge.cls}`}>
                  {r.badge.label}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

interface QuickAction { label: string; icon: React.ElementType; href: string; color: string }

function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 p-5">
      <p className="mb-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">Quick Actions</p>
      <div className="grid grid-cols-2 gap-2">
        {actions.map((a) => (
          <Link key={a.label} href={a.href} className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-xs font-medium text-center transition-colors ${a.color}`}>
            <a.icon className="h-4 w-4" />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

const LEAVE_STATUS_BADGE: Record<string, string> = {
  pending:   "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  approved:  "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  rejected:  "bg-red-500/10 text-red-600 dark:text-red-400",
  cancelled: "bg-gray-100 text-gray-500 dark:bg-zinc-700/50 dark:text-zinc-400",
};

function latestMonth(months: string[]): string | null {
  return months.length ? months.sort().at(-1)! : null;
}

const MESSAGES_ACTION: QuickAction = {
  label: "Messages", icon: MessageSquare, href: "/dashboard/messages",
  color: "text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20",
};
const DOCUMENTS_ACTION: QuickAction = {
  label: "Documents", icon: FolderOpen, href: "/dashboard/documents",
  color: "text-sky-600 dark:text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20",
};
const LEAVES_ACTION: QuickAction = {
  label: "My Leaves", icon: CalendarOff, href: "/dashboard/leaves",
  color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20",
};

async function TemplatePanels({ templateId, staffId }: { templateId: string | null; staffId: string }) {
  const schoolId = await getCurrentSchoolIdOrThrow();

  if (templateId === "librarian") {
    const [{ data: books }, { data: issues }] = await Promise.all([
      supabaseAdmin.from("library_books").select("id, title, category, total_copies").eq("school_id", schoolId),
      supabaseAdmin.from("book_issues").select("book_id, due_date, returned_date, borrower_type").eq("school_id", schoolId).is("returned_date", null),
    ]);
    const today = new Date().toISOString().slice(0, 10);
    const bookTitle = new Map((books ?? []).map((b) => [b.id, b.title]));
    const categories = new Set((books ?? []).map((b) => b.category)).size;
    const overdue = (issues ?? []).filter((i) => i.due_date && i.due_date < today);

    const stats: Stat[] = [
      { label: "Total Books", value: String((books ?? []).length), sub: `${categories} categories`, icon: BookOpen, accent: "text-indigo-500 bg-indigo-500/10" },
      { label: "Currently Issued", value: String((issues ?? []).length), sub: "not yet returned", icon: Users, accent: "text-blue-500 bg-blue-500/10" },
      { label: "Overdue Returns", value: String(overdue.length), sub: "past due date", icon: AlertTriangle, accent: "text-red-500 bg-red-500/10" },
      { label: "Categories", value: String(categories), sub: "in catalog", icon: Package, accent: "text-emerald-500 bg-emerald-500/10" },
    ];

    const rows: Row[] = overdue.slice(0, 5).map((i) => ({
      title: bookTitle.get(i.book_id) ?? "Unknown title",
      subtitle: `Issued to ${i.borrower_type} · due ${formatDate(i.due_date)}`,
      badge: { label: "overdue", cls: "bg-red-500/10 text-red-600 dark:text-red-400" },
    }));

    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{stats.map((s) => <StatCard key={s.label} stat={s} />)}</div>
        <ListPanel title="Overdue Books" href="/dashboard/library" hrefLabel="Manage library" rows={rows} emptyLabel="No overdue books" />
      </>
    );
  }

  if (templateId === "warden") {
    const [{ data: rooms }, { data: allotments }] = await Promise.all([
      supabaseAdmin.from("hostel_rooms").select("id, room_no, block, capacity, status, warden_id").eq("school_id", schoolId),
      supabaseAdmin.from("hostel_allotments").select("room_id, monthly_fee, fee_status, students ( full_name )").eq("school_id", schoolId),
    ]);
    const myRooms = (rooms ?? []).filter((r) => r.warden_id === staffId);
    const scoped = myRooms.length > 0 ? myRooms : (rooms ?? []);
    const scopedIds = new Set(scoped.map((r) => r.id));
    const capacity = scoped.reduce((s, r) => s + (r.capacity ?? 0), 0);
    const myAllotments = (allotments ?? []).filter((a) => scopedIds.has(a.room_id));
    const dues = myAllotments.filter((a) => a.fee_status !== "paid");

    const stats: Stat[] = [
      { label: myRooms.length > 0 ? "Rooms Managed" : "Rooms (School-wide)", value: String(scoped.length), sub: myRooms.length > 0 ? "assigned to you" : "no rooms assigned yet", icon: BedDouble, accent: "text-indigo-500 bg-indigo-500/10" },
      { label: "Total Capacity", value: String(capacity), sub: "beds", icon: Users, accent: "text-blue-500 bg-blue-500/10" },
      { label: "Occupied", value: String(myAllotments.length), sub: `${Math.max(capacity - myAllotments.length, 0)} vacant`, icon: Users, accent: "text-emerald-500 bg-emerald-500/10" },
      { label: "Fee Dues", value: String(dues.length), sub: "students pending", icon: AlertTriangle, accent: "text-amber-500 bg-amber-500/10" },
    ];

    const rows: Row[] = dues.slice(0, 5).map((a) => ({
      title: (a.students as unknown as { full_name: string } | null)?.full_name ?? "Unknown student",
      subtitle: `${formatCurrency(Number(a.monthly_fee ?? 0))} / month`,
      badge: { label: a.fee_status ?? "overdue", cls: a.fee_status === "partial" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400" : "bg-red-500/10 text-red-600 dark:text-red-400" },
    }));

    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{stats.map((s) => <StatCard key={s.label} stat={s} />)}</div>
        <ListPanel title="Pending Hostel Fee Dues" href="/dashboard/hostel" hrefLabel="Manage hostel" rows={rows} emptyLabel="No pending fee dues" />
      </>
    );
  }

  if (templateId === "accountant") {
    const [{ data: feeRows }, { data: expenseRows }, { data: payrollRows }] = await Promise.all([
      supabaseAdmin.from("fee_payments").select("month_str, amount_due, amount_paid, status, category, paid_date, students ( full_name )").eq("school_id", schoolId),
      supabaseAdmin.from("expenses").select("month_str, amount, category, status, date").eq("school_id", schoolId),
      supabaseAdmin.from("payroll_records").select("month_str, status").eq("school_id", schoolId),
    ]);
    const feeMonth = latestMonth((feeRows ?? []).map((f) => f.month_str));
    const expMonth = latestMonth((expenseRows ?? []).map((e) => e.month_str));
    const payMonth = latestMonth((payrollRows ?? []).map((p) => p.month_str));

    const feesThisMonth = (feeRows ?? []).filter((f) => f.month_str === feeMonth);
    const collected = feesThisMonth.reduce((s, f) => s + Number(f.amount_paid ?? 0), 0);
    const due = feesThisMonth.reduce((s, f) => s + Number(f.amount_due ?? 0), 0) - collected;
    const expensesThisMonth = (expenseRows ?? []).filter((e) => e.month_str === expMonth);
    const expenseTotal = expensesThisMonth.reduce((s, e) => s + Number(e.amount ?? 0), 0);
    const payrollThisMonth = (payrollRows ?? []).filter((p) => p.month_str === payMonth);
    const payrollPending = payrollThisMonth.filter((p) => p.status !== "processed").length;

    const stats: Stat[] = [
      { label: "Fee Collected", value: formatCurrency(collected), sub: feeMonth ? new Date(feeMonth + "-01").toLocaleDateString("en-IN", { month: "long" }) : "—", icon: IndianRupee, accent: "text-emerald-500 bg-emerald-500/10" },
      { label: "Fee Dues", value: formatCurrency(Math.max(due, 0)), sub: "outstanding", icon: AlertTriangle, accent: "text-red-500 bg-red-500/10" },
      { label: "Expenses", value: formatCurrency(expenseTotal), sub: expMonth ? new Date(expMonth + "-01").toLocaleDateString("en-IN", { month: "long" }) : "—", icon: Wallet, accent: "text-amber-500 bg-amber-500/10" },
      { label: "Payroll Pending", value: String(payrollPending), sub: `of ${payrollThisMonth.length} staff`, icon: Users, accent: "text-indigo-500 bg-indigo-500/10" },
    ];

    const recentPayments = feesThisMonth
      .filter((f) => f.paid_date)
      .sort((a, b) => (b.paid_date ?? "").localeCompare(a.paid_date ?? ""))
      .slice(0, 5);
    const rows: Row[] = recentPayments.map((f) => ({
      title: (f.students as unknown as { full_name: string } | null)?.full_name ?? "Unknown student",
      subtitle: `${f.category} · paid ${formatDate(f.paid_date)}`,
      badge: { label: f.status ?? "paid", cls: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    }));

    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{stats.map((s) => <StatCard key={s.label} stat={s} />)}</div>
        <ListPanel title="Recent Fee Payments" href="/dashboard/fees" hrefLabel="Manage fees" rows={rows} emptyLabel="No payments recorded this month" />
      </>
    );
  }

  if (templateId === "hr_manager") {
    const [{ data: staffRows }, { data: leaveRows }, { data: payrollRows }] = await Promise.all([
      supabaseAdmin.from("staff_members").select("id, status").eq("school_id", schoolId),
      supabaseAdmin.from("leave_requests").select("id, leave_type, from_date, to_date, status, staff_members!leave_requests_staff_id_fkey ( full_name )").eq("school_id", schoolId),
      supabaseAdmin.from("payroll_records").select("month_str, status").eq("school_id", schoolId),
    ]);
    const totalStaff = (staffRows ?? []).length;
    const onLeaveToday = (staffRows ?? []).filter((s) => s.status === "on_leave").length;
    const pendingLeaves = (leaveRows ?? []).filter((l) => l.status === "pending");
    const payMonth = latestMonth((payrollRows ?? []).map((p) => p.month_str));
    const payrollThisMonth = (payrollRows ?? []).filter((p) => p.month_str === payMonth);
    const payrollProcessed = payrollThisMonth.filter((p) => p.status === "processed").length;

    const stats: Stat[] = [
      { label: "Total Staff", value: String(totalStaff), sub: "all departments", icon: Briefcase, accent: "text-indigo-500 bg-indigo-500/10" },
      { label: "On Leave Today", value: String(onLeaveToday), sub: "marked on_leave", icon: CalendarOff, accent: "text-amber-500 bg-amber-500/10" },
      { label: "Pending Approvals", value: String(pendingLeaves.length), sub: "leave requests", icon: Clock, accent: "text-red-500 bg-red-500/10" },
      { label: "Payroll Run", value: `${payrollProcessed}/${payrollThisMonth.length}`, sub: payMonth ? new Date(payMonth + "-01").toLocaleDateString("en-IN", { month: "long" }) : "—", icon: Wallet, accent: "text-emerald-500 bg-emerald-500/10" },
    ];

    const rows: Row[] = pendingLeaves.slice(0, 5).map((l) => ({
      title: (l.staff_members as unknown as { full_name: string } | null)?.full_name ?? "Unknown staff",
      subtitle: `${l.leave_type} · ${formatDate(l.from_date)} – ${formatDate(l.to_date)}`,
      badge: { label: "pending", cls: LEAVE_STATUS_BADGE.pending },
    }));

    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{stats.map((s) => <StatCard key={s.label} stat={s} />)}</div>
        <ListPanel title="Pending Leave Approvals" href="/dashboard/leaves" hrefLabel="Review requests" rows={rows} emptyLabel="No pending leave requests" />
      </>
    );
  }

  if (templateId === "receptionist") {
    const [{ data: appRows }, { data: annRows }, { data: docRows }] = await Promise.all([
      supabaseAdmin.from("admission_applications").select("id, applicant_name, applying_for_grade, submitted_date, status").eq("school_id", schoolId),
      supabaseAdmin.from("announcements").select("id, status").eq("school_id", schoolId),
      supabaseAdmin.from("documents").select("id").eq("school_id", schoolId),
    ]);
    const pendingApps = (appRows ?? []).filter((a) => a.status === "pending" || a.status === "under_review");
    const activeAnnouncements = (annRows ?? []).filter((a) => a.status === "active").length;

    const stats: Stat[] = [
      { label: "Pending Applications", value: String(pendingApps.length), sub: "awaiting review", icon: UserPlus, accent: "text-indigo-500 bg-indigo-500/10" },
      { label: "Total Applications", value: String((appRows ?? []).length), sub: "this cycle", icon: Users, accent: "text-blue-500 bg-blue-500/10" },
      { label: "Active Announcements", value: String(activeAnnouncements), sub: "published", icon: Megaphone, accent: "text-emerald-500 bg-emerald-500/10" },
      { label: "Documents", value: String((docRows ?? []).length), sub: "circulars & forms", icon: FolderOpen, accent: "text-amber-500 bg-amber-500/10" },
    ];

    const rows: Row[] = pendingApps.slice(0, 5).map((a) => ({
      title: a.applicant_name ?? "Unknown applicant",
      subtitle: `Grade ${a.applying_for_grade ?? "—"} · submitted ${formatDate(a.submitted_date)}`,
      badge: { label: a.status ?? "pending", cls: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    }));

    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{stats.map((s) => <StatCard key={s.label} stat={s} />)}</div>
        <ListPanel title="Pending Admissions" href="/dashboard/admissions" hrefLabel="Review applications" rows={rows} emptyLabel="No pending applications" />
      </>
    );
  }

  if (templateId === "lab_assistant") {
    const { data: items } = await supabaseAdmin.from("inventory_items").select("id, name, category, condition, total_qty, damaged_qty, location").eq("school_id", schoolId);
    const categories = new Set((items ?? []).map((i) => i.category)).size;
    const needsAttention = (items ?? []).filter((i) => i.condition !== "good" || (i.damaged_qty ?? 0) > 0);
    const totalQty = (items ?? []).reduce((s, i) => s + (i.total_qty ?? 0), 0);

    const stats: Stat[] = [
      { label: "Total Items", value: String((items ?? []).length), sub: `${totalQty} units`, icon: Package, accent: "text-indigo-500 bg-indigo-500/10" },
      { label: "Categories", value: String(categories), sub: "in inventory", icon: Package, accent: "text-blue-500 bg-blue-500/10" },
      { label: "Needs Attention", value: String(needsAttention.length), sub: "fair/poor or damaged", icon: AlertTriangle, accent: "text-red-500 bg-red-500/10" },
      { label: "Good Condition", value: String((items ?? []).filter((i) => i.condition === "good").length), sub: "of total items", icon: Package, accent: "text-emerald-500 bg-emerald-500/10" },
    ];

    const rows: Row[] = needsAttention.slice(0, 5).map((i) => ({
      title: i.name,
      subtitle: `${i.location ?? "—"} · ${i.damaged_qty ?? 0} damaged`,
      badge: { label: i.condition ?? "fair", cls: i.condition === "poor" ? "bg-red-500/10 text-red-600 dark:text-red-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    }));

    return (
      <>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{stats.map((s) => <StatCard key={s.label} stat={s} />)}</div>
        <ListPanel title="Items Needing Attention" href="/dashboard/inventory" hrefLabel="Manage inventory" rows={rows} emptyLabel="All items in good condition" />
      </>
    );
  }

  const [{ data: docRows }, { data: annRows }] = await Promise.all([
    supabaseAdmin.from("documents").select("id").eq("school_id", schoolId),
    supabaseAdmin.from("announcements").select("id, status").eq("school_id", schoolId),
  ]);
  const stats: Stat[] = [
    { label: "Documents", value: String((docRows ?? []).length), sub: "circulars & forms", icon: FolderOpen, accent: "text-sky-500 bg-sky-500/10" },
    { label: "Announcements", value: String((annRows ?? []).filter((a) => a.status === "active").length), sub: "active", icon: Megaphone, accent: "text-indigo-500 bg-indigo-500/10" },
  ];
  return (
    <>
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
          <AlertTriangle className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-zinc-100">No permission template assigned yet</p>
          <p className="text-xs text-gray-500 dark:text-zinc-400">Ask your school admin to assign one from the Staff Directory to unlock your full workspace.</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">{stats.map((s) => <StatCard key={s.label} stat={s} />)}</div>
    </>
  );
}

const COLOR_TEAL    = "text-teal-600 dark:text-teal-400 bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/20";
const COLOR_EMERALD = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20";
const COLOR_AMBER   = "text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20";
const COLOR_INDIGO  = "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/20";
const COLOR_VIOLET  = "text-violet-600 dark:text-violet-400 bg-violet-500/10 hover:bg-violet-500/20 border-violet-500/20";

function templateQuickActions(templateId: string | null): QuickAction[] {
  switch (templateId) {
    case "librarian":
      return [
        { label: "Library", icon: BookOpen, href: "/dashboard/library", color: COLOR_TEAL },
        DOCUMENTS_ACTION, MESSAGES_ACTION, LEAVES_ACTION,
      ];
    case "warden":
      return [
        { label: "Hostel", icon: BedDouble, href: "/dashboard/hostel", color: COLOR_TEAL },
        DOCUMENTS_ACTION, MESSAGES_ACTION, LEAVES_ACTION,
      ];
    case "accountant":
      return [
        { label: "Fees", icon: IndianRupee, href: "/dashboard/fees", color: COLOR_EMERALD },
        { label: "Expenses", icon: Wallet, href: "/dashboard/expenses", color: COLOR_AMBER },
        { label: "Payroll", icon: Users, href: "/dashboard/payroll", color: COLOR_INDIGO },
        MESSAGES_ACTION,
      ];
    case "hr_manager":
      return [
        { label: "Staff Directory", icon: Briefcase, href: "/dashboard/staff", color: COLOR_INDIGO },
        { label: "Leave Approvals", icon: CalendarOff, href: "/dashboard/leaves", color: COLOR_AMBER },
        { label: "Payroll", icon: Wallet, href: "/dashboard/payroll", color: COLOR_EMERALD },
        MESSAGES_ACTION,
      ];
    case "receptionist":
      return [
        { label: "Admissions", icon: UserPlus, href: "/dashboard/admissions", color: COLOR_INDIGO },
        { label: "Announcements", icon: Megaphone, href: "/dashboard/announcements", color: COLOR_VIOLET },
        DOCUMENTS_ACTION, MESSAGES_ACTION,
      ];
    case "lab_assistant":
      return [
        { label: "Inventory", icon: Package, href: "/dashboard/inventory", color: COLOR_TEAL },
        DOCUMENTS_ACTION, MESSAGES_ACTION, LEAVES_ACTION,
      ];
    default:
      return [DOCUMENTS_ACTION, { label: "Announcements", icon: Megaphone, href: "/dashboard/announcements", color: COLOR_VIOLET }, MESSAGES_ACTION, LEAVES_ACTION];
  }
}

export async function StaffView({ user }: { user: User }) {
  const name = (user.user_metadata?.full_name as string)?.split(" ")[0] || "there";
  const staff = await getStaffContext(user.id);

  if (!staff) {
    return (
      <div className="w-full px-6 py-8">
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 py-24 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-200 dark:border-zinc-700 bg-gray-50 dark:bg-zinc-800 text-2xl">🧑‍💼</div>
          <p className="text-base font-semibold text-gray-900 dark:text-zinc-50">No staff record linked to this login</p>
          <p className="max-w-sm text-sm text-gray-500 dark:text-zinc-400">
            This account doesn&apos;t have a staff record yet. Ask your school admin to link your login.
          </p>
        </div>
      </div>
    );
  }

  const { data: leaveRows } = await supabaseAdmin
    .from("leave_requests")
    .select("leave_type, from_date, to_date, status")
    .eq("staff_id", staff.staffId)
    .order("applied_on", { ascending: false })
    .limit(3);

  const leaves: Row[] = (leaveRows ?? []).map((l) => ({
    title: `${l.leave_type} leave`,
    subtitle: `${formatDate(l.from_date)} – ${formatDate(l.to_date)}`,
    badge: { label: l.status ?? "pending", cls: LEAVE_STATUS_BADGE[l.status ?? "pending"] ?? "" },
  }));

  const templateLabel = staff.permissionTemplateId ? TEMPLATE_LABEL[staff.permissionTemplateId] ?? staff.permissionTemplateName : null;
  const quickActions = templateQuickActions(staff.permissionTemplateId);

  return (
    <div className="w-full px-6 py-6 space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-zinc-50">{getGreeting()}, {name} 👋</h2>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">
            {staff.designation || "Staff Manager"}{templateLabel ? ` · ${templateLabel}` : ""} · {formatHeaderDate()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TemplatePanels templateId={staff.permissionTemplateId} staffId={staff.staffId} />
        </div>
        <div className="space-y-5">
          <QuickActions actions={quickActions} />
          <ListPanel title="My Leave Requests" href="/dashboard/leaves" hrefLabel="View all" rows={leaves} emptyLabel="No leave requests yet" />
        </div>
      </div>
    </div>
  );
}
