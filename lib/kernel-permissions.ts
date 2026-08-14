// Platform-team access tiers, shared between server code (actions, admin
// queries) and client components. Kept dependency-free — importing the
// service-role admin client here would leak it into client bundles.
export const KERNEL_PERMISSIONS = ["owner", "admin", "viewer"] as const;
export type KernelPermission = (typeof KERNEL_PERMISSIONS)[number];

export const KERNEL_PERMISSION_LABELS: Record<KernelPermission, string> = {
  owner: "Owner",
  admin: "Admin",
  viewer: "Viewer",
};
