import { redirect } from "next/navigation";

// /dashboard/fee-collection merged into /dashboard/fees, which now renders
// the institution-wide collection view for super_admin and the per-school
// view for admin/accountant/parent from a single route. Kept as a redirect
// so old links/bookmarks still land somewhere.
export default function FeeCollectionRedirect() {
  redirect("/dashboard/fees");
}
