# Role & Identity Model — Design Notes

Status: **Phases 1–3 shipped** (§7, §9). Phase 3 landed as "stop writing `profiles.role = 'admin'` on promotion," not a literal enum collapse — see §9 for why that's the actual correct shape. Phases 4–5 still design-only.
Scope: how Shikshaloy represents "who a person is" and "what they can access," and how that needs to change to support a person holding more than one relationship to a school (or to more than one school).

## 1. The problem

Three real scenarios exposed the same underlying limitation:

1. **A teacher gets promoted to Principal.** Today this creates a brand-new `auth.users` account instead of upgrading the existing one — the teacher's history, login, and payroll record are left behind, disconnected from their new admin account.
2. **A Principal (or teacher, or driver) is also a parent at the same school.** The system already partially supports this (see §2.3) but has no UI to make it usable.
3. **A person could plausibly hold different relationships at different schools** — teacher at School A, parent at School B — and in the future, more than one institution could run Shikshaloy, so this isn't a hypothetical edge case long-term.

All three trace back to one design choice: **`profiles.role` is a single, exclusive value that conflates three unrelated things** — a person's job, their permission level, and which "hat" they're currently wearing.

## 2. Current state (as built today)

### 2.1 `profiles.role`

```sql
create type user_role as enum (
  'kernel', 'super_admin', 'admin', 'staff', 'teacher', 'parent', 'student', 'driver'
);
```
(`supabase/migrations/20260628000000_initial_schema.sql:11-13`)

One value per account. Dashboard routing is a single switch on it (`app/dashboard/page.tsx:25-32`), and ~34 `requireRole([...])` + ~25 `requireRoleOrStaffTemplate(...)` + ~88 raw `role === "..."` checks across roughly 50 files gate features on it.

### 2.2 `staff_members` already models "teacher = staff," partially

`staff_members` (`school_id`, `profile_id`, `type: teaching|non_teaching`, `designation`, `permission_template_id`) already stores teachers, non-teaching staff, *and* drivers (`app/dashboard/drivers/actions.ts:55-66` inserts `type: "non_teaching", designation: "Driver"`). But `profiles.role = 'teacher'` is tracked **separately and redundantly** — and the two sources of truth already disagree in practice: the "assign teacher to class" picker filters `profiles.role = 'teacher'` (`app/dashboard/classes/page.tsx:233-239`), not `staff_members.type = 'teaching'`. A promoted teacher would silently vanish from that picker under the current model.

`permission_template_id` (values: `accountant`, `receptionist`, `hr_manager`, `librarian`, `warden`, `lab_assistant`, checked via `requireRoleOrStaffTemplate`, `lib/auth/verified-role.ts:59-80`) is already a working **access-group mechanism**, just scoped only to the `staff` role and missing an `admin` tier.

### 2.3 Parent linkage is already decoupled from role — this is the model to generalize

`parents` is a separate table with its own `profile_id`, unrelated to `profiles.role`. When a parent is linked (`lib/students/enroll.ts:131-190`) the code checks whether that email already has an `auth.users` account and **reuses that same `profile_id`** rather than creating a second login — so a principal, teacher, or driver who is also a parent does **not** get a duplicate account today.

`getParentContext(profileId)` (`lib/parents/context.ts:41-46`) is fully role-agnostic — it queries `parents.profile_id = user.id` directly, never checks `role`. `/dashboard/children` already works for anyone linked this way.

**The only actual gap:** `nav-data.ts:274-280` only shows the "My Children" link in the `parent` role's nav array, so a non-parent-role account with a linked `parents` row has no visible entry point to it.

### 2.4 RLS is not the constraint

Checked `supabase/migrations/20260628000000_initial_schema.sql`: virtually every table's RLS policy is `school_id = auth_school_id() or auth_role() = 'kernel'` — tenant isolation is keyed on `school_id`, not on fine-grained role. Role-specific authorization lives entirely in **application code** (`requireRole`/`requireRoleOrStaffTemplate`), not the database. This matters for scoping: restructuring roles is an app-layer migration, not a security-model rewrite.

## 3. Target model

### 3.1 Three independent axes, not one field

| Axis | Question it answers | Where it lives |
|---|---|---|
| **Identity type** | What kind of account is this, fundamentally? | `profiles.role` (shrunk) |
| **Job & access** (staff only) | What's their job, and what can they do? | `staff_members.type` / `designation` / `access_role` |
| **Relationships** | What else are they connected to, independent of the above? | `parents.profile_id`, `students.profile_id` |

The bug in the current model is that axis 1 and axis 2 are fused into one enum, and axis 3 has no first-class UI even though the data model already supports it.

### 3.2 `profiles.role` — reduced to 6 values

`kernel | super_admin | staff | parent | student | driver`

- **`admin` and `teacher` collapse into `staff`.** Distinguished instead by `staff_members.type` (`teaching`/`non_teaching`), `designation` (free text — "Principal," "Senior Teacher," etc.), and `access_role`.
- **`driver` stays separate** (explicit decision) — even though a driver's employment record lives in `staff_members` today (for payroll), `driver` keeps its own `profiles.role` value and default dashboard rather than folding into the generic staff nav/access-role composition.
- **`kernel`, `super_admin`, `parent`, `student`** are unchanged — each has a genuinely different data shape (`super_admin` spans multiple schools with no single `school_id`; `kernel` isn't a school account at all; `parent`/`student` aren't employees).

### 3.3 `access_role` — widened from `permission_template_id`

Values: `admin`, `accountant`, `receptionist`, `hr_manager`, `librarian`, `warden`, `lab_assistant`, or none (default teacher/staff self-service). Lives on `staff_members`, checked the same way `requireRoleOrStaffTemplate` already checks `permission_template_id` today — this is a widening of an existing, working mechanism, not a new one.

**As implemented in Phase 1 (§7):** no new column was added. `permission_template_id`/`permission_template_name` (`text`, no `CHECK` constraint — confirmed empty in `supabase/migrations/20260628000000_initial_schema.sql:268-269`) already accept `'admin'`/`'Admin'` as values with zero migration. A dedicated `access_role` column is still the cleaner long-term name, but reusing the existing column was the lower-risk additive move for Phase 1 and is what's live today.

**Promotion = an `access_role` write**, not an identity swap:
- `designation` (e.g. "Teacher" → "Principal") is a cosmetic label — changing it alone grants nothing.
- `access_role` (e.g. `none` → `admin`) is the actual permission grant — this is what `requireRole`-equivalent checks read.
- A promotion action would typically write both together, but they're independent columns; a title-only change or a permission-only change are both valid, separate operations.

This single change resolves every wrinkle found while designing the promotion feature:
- **Payroll** (`payroll_records.staff_id → staff_members.id`) is untouched by role — it was never coupled to `profiles.role` in the first place, so a promoted principal's salary processing keeps working with zero changes.
- **Teacher pickers** keep matching them — they're still `type: teaching` regardless of `access_role`.
- **"Teacher who is also admin"** stops being a contradiction: `type: teaching, access_role: admin` on one row. Their dashboard shows teacher content **and** admin content together (nav composition), because `access_role` grants are additive within one identity, not competing identities.

## 4. Multi-identity, multi-school

### 4.1 Two independent switchers, sequenced

1. **School switcher** — resolves first. Needed because a profile's context is itself school-specific (teacher at School A, parent at School B), so school must be known before any identity can be resolved. Reuses the existing cookie-based pattern already proven in `app/dashboard/_components/school-switcher-actions.ts` (`ACTIVE_SCHOOL_COOKIE`, a validating server action, `revalidatePath`). Invisible when a profile only resolves to one school (the common case).
2. **Identity (role) switcher** — scoped to whichever school is active, shown only if the profile resolves to more than one identity **at that school**. Lives in the profile modal. Example: default lands on Teacher; if also linked as a Parent at the same school, an explicit "Teacher ⇄ Parent" option appears.

**Rule of thumb:** switch between *contexts* (different underlying tables — `staff_members` vs `parents` vs `students`, genuinely different data shapes); compose *within* a context (different `access_role` grants on the same `staff_members` row — additive, no switch).

### 4.2 Storage — no new "identities" table

An identity is just a row, already stored where it lives today:

| Identity type | Table | Key |
|---|---|---|
| Staff (teacher / admin / accountant / driver / …) | `staff_members` | `profile_id`, `school_id`, `type`, `designation`, `access_role` |
| Parent | `parents` | `profile_id`, `school_id` |
| Student | `students` | `profile_id`, `school_id` |

A profile with multiple identities is simply multiple rows across these tables sharing one `profile_id` — same school (teacher + parent) or different schools (teacher at A, parent at B). This already works structurally today (§2.3); nothing new needs to be added to store it.

`profiles.role` / `profiles.school_id` stop meaning "the" identity and become the **default pointer** — which identity to land on after login. No schema change needed for this; it's a reinterpretation of existing columns. Unaffected for the ~99% of accounts with exactly one identity.

### 4.3 Resolving identities at runtime

A single resolver, not a denormalized table (avoids sync drift across the ~50 files that create/delete `staff_members`/`parents`/`students` rows):

```
getIdentitiesForProfile(profileId):
  → staff_members  where profile_id = X   (one row per school they work at)
  → parents        where profile_id = X   (one row per school they're a guardian at)
  → students       where profile_id = X
  → merge into: [{ type, schoolId, refId, label, isDefault }]
```

Powers both switchers directly: distinct `schoolId`s → school switcher; filtered to the active `schoolId` → identity switcher (shown only if `length > 1`).

### 4.4 Active-state storage

Reuse the existing cookie idiom. Keep `ACTIVE_SCHOOL_COOKIE` as-is; add `ACTIVE_IDENTITY_COOKIE` (e.g. `"staff:<staff_members.id>"` / `"parent:<parents.id>"`). Re-validated server-side against `getIdentitiesForProfile()` on every load — never trusted blindly from the client, same trust boundary the existing school cookie already uses.

### 4.5 Dashboard content becomes permission-driven, not a static per-role switch

Today: `dashboard/page.tsx` is `if (role === X) return <XView>`; `nav-data.ts` is a static per-role array. Target: nav is composed from the active identity's capabilities —
- Base nav from `staff_members.type` (teaching → classes/grades/homework; non_teaching → none by default)
- Layered blocks unlocked per `access_role` grant (`admin` → full admin module tree; `accountant` → Fees/Payroll; `receptionist` → Admissions/Front Desk; …)

This generalizes the filtering `getVerifiedStaffTemplateId`/`searchDirectory` already do for staff templates today (`app/dashboard/_lib/directory-search.ts:23-33`) — not a new concept, applied more broadly.

## 5. What's explicitly out of scope / deferred

- **Multi-school-per-profile at the RLS/tenant level.** `auth_school_id()` currently reads a single `profiles.school_id` column and backs nearly every RLS policy. Supporting a profile with rows at multiple schools simultaneously (not just switching which one is "active") would need a `profile_schools` join table and a rewrite of `auth_school_id()` plus policy-by-policy review. This is a materially bigger and riskier change than the identity switcher and is **not required** to build the switcher — "active school" + "active identity" cookies compose fine on top of today's single-`school_id`-per-profile RLS model, since only one school is ever "live" for a request at a time regardless of how many the profile could theoretically belong to.
- **Folding `driver` into the generic `staff` nav/access-role composition.** Explicit decision: keep `driver` as its own `profiles.role` and default dashboard, even though its employment data lives in `staff_members` like other staff.
- **`unique(profile_id, school_id)` constraints on `staff_members` and `parents`.** Not present today. Worth adding once the identity model is built, so a profile can't end up with two ambiguous staff rows at the same school (multiple grants belong on one row via `access_role`, not multiple rows).

## 6. Suggested build order

1. ~~**Additive schema**: add `access_role` to `staff_members`...~~ **Done — see §7.** (Shipped by reusing `permission_template_id` instead of adding a new column; behaviorally equivalent.)
2. ~~**Migrate call sites**...~~ **Done — see §9.** Shipped together with step 3 (below), not in isolation — §8 explains why isolation would have been pure risk for zero behavior change.
3. ~~**Collapse** `profiles.role`'s `admin`/`teacher` values...~~ **Landed differently — see §9.** The enum itself is untouched (`invitePrincipal` still writes `role = 'admin'` for brand-new admins); what shipped is "promotion stops writing it," which delivers the same capability (teacher keeps their role, gains admin access) without needing the literal enum drop. `dashboard/page.tsx` + `nav-data.ts`/sidebar routing were reworked to route on the merged signal, not a full capability-composition rebuild (that's still step 4/5 territory).
4. **Build the identity resolver + switchers** (§4.3–4.5): `getIdentitiesForProfile`, `ACTIVE_IDENTITY_COOKIE`, profile-modal UI. Not started. This is also what would let a promoted teacher get back to a genuine "Teacher" view instead of always landing on `AdminView` — see §9's known limitations.
5. Surface "My Children" (or the generalized identity switcher, once built) for any profile with a linked `parents` row — closes the gap found in §2.3 as a side effect of step 4.

## 7. Phase 1 — shipped

`promoteExistingToAdmin` / `searchPromotableStaff` (`app/dashboard/principals/actions.ts`), a "Promote Existing" tab on both invite-principal entry points (`PrincipalsClient.tsx`, `PeopleClient.tsx`), and `sendAdminPromotionEmail` (`lib/email/resend.ts`). Commits `0c71654`, `f33fc99`.

Promotion upgrades an existing teacher/staff account in place — same login, same `profiles.id`, same `staff_members` row (kept active, not deactivated, since `payroll_records.staff_id` points at it and was never coupled to role). Writes `profiles.role = 'admin'` (so every existing `requireRole(["admin", ...])` check keeps working unmodified — this is the "dual-running" step 1 described above) *and* `staff_members.permission_template_id = 'admin'` (inert today, forward-compatible for step 2 whenever it ships).

**A real production gap was found and closed along the way.** `invitePrincipal` — the only place that has ever created a new `admin` account — has always created just an `auth.users` + `profiles` row, never a `staff_members` row. Every admin created before this session therefore had `profiles.role = 'admin'` with no staff record at all. Confirmed via a live count query against the production project (`hhdeqpwmvrhptwtbcyzh`): **2 of 2** admin profiles were missing a `staff_members` row. Fixed with:
- `supabase/migrations/20260911130000_backfill_admin_staff_members.sql` — one-time, idempotent backfill (applied to production; re-verified 0/2 missing afterward).
- `invitePrincipal` now creates the `staff_members` row at invite time too, matching what promotion already did, so the gap can't reopen.
- Commit `9b3afa9`.

This gap mattered specifically *because* of the direction this doc proposes: had step 2 (migrating checks to read `staff_members`) shipped before this fix, every existing admin would have been locked out the moment it deployed. Worth remembering as a general lesson for the rest of this migration: **any step that reads `staff_members` as an authorization signal needs to first confirm every account that currently passes the old check also has a `staff_members` row** — don't assume it.

## 8. Phase 2 finding — cannot ship as an isolated step

Investigated the real scope of "migrate call sites" precisely (not just the rough "~50 files" estimate in §2.1):

- 18 files: `requireRole([...])` where the allowed list includes `"admin"`
- 23 files: `requireRoleOrStaffTemplate([...])` where the allowed list includes `"admin"`
- 42 files: raw `role === "admin"`-style checks (mostly page-level UI guards, not server-action enforcement)

Roughly matches the original estimate — the scope wasn't wrong. What's wrong is doing it as a standalone step. **Today, and for as long as promotion keeps writing `profiles.role = 'admin'`, every admin account has both signals (`profiles.role = 'admin'` and `staff_members.permission_template_id = 'admin'`) set together, always.** Nothing in the system can ever have one without the other until step 3 (stop writing `profiles.role = 'admin'`, keep the person's real role) actually ships. So migrating the 40-80 authorization call sites to read the new signal, on its own, changes zero behavior for any real account — it's pure security-critical-code churn (real risk of a mistake either locking someone out or, worse, opening unauthorized access) for no payoff until step 3 lands too.

**Options going forward, not yet decided:**
1. Merge steps 2 and 3 into one coordinated change — migrate the checks *and* stop flipping `profiles.role` in the same pass, so "teacher who's also admin" actually goes live when it's done, not two separate risky deploys with an inert one first.
2. Ship narrow first — get one real flow (e.g. just the Administrators page + a few core admin actions) working end-to-end on the new model, accept inconsistent access for a promoted teacher until the rest catches up, expand over multiple sessions.
3. Hold — Phase 1 already delivers the actual user-facing feature (promote without losing identity/history/payroll). The rest is architecture for whenever the multi-session investment is worth it.

Paused at this decision point per explicit instruction (2026-09-11).

## 9. Phases 2+3 — shipped merged (2026-09-12), commit `6653b7c`

Went with option 1 from §8: migrated the checks and stopped writing `profiles.role = 'admin'` on promotion in the same pass, so the capability actually went live instead of landing as inert plumbing.

**Read side** (`lib/auth/verified-role.ts`):
- `requireRole`/`requireRoleOrStaffTemplate` fall back to a `staff_members.permission_template_id = 'admin'` grant when the caller's literal role doesn't already satisfy an "admin" check in the allowed list. No-op for every existing admin (their literal role still matches first) — this is what made it safe to migrate ahead of confirming real-world usage.
- New `isAdmin(vu)` for the ~40 files that inline a `role === "admin"` comparison instead of calling `requireRole` — real scope was 47 admin-gated `requireRole`/`requireRoleOrStaffTemplate` call sites (matched §8's estimate) plus a comparable number of raw inline checks the earlier grep missed (`.includes([...])` and `new Set([...]).has(role)` patterns needed a second sweep to catch — `assignHomework` in `homework/actions.ts` and `MARKS_ENTRY_ROLES` in `grades/actions.ts`).

**A gap the plan hadn't accounted for:** `dashboard/layout.tsx` resolves the sidebar nav's role *independently* of `dashboard/page.tsx`'s view routing. Fixing only the routing would have sent a promoted teacher to `AdminView` while the sidebar still showed the Teacher nav — reachable admin screens with no visible way to navigate to them. Both had to move together.

**Another gap:** two admin-listing queries (`principals/page.tsx`, `people/page.tsx`) filtered `profiles.role = 'admin'` directly to build the "Administrators" table. Once promotion stopped writing that field, a promoted teacher would have silently vanished from their own institution's admin list — fixed by merging in `staff_members` rows carrying the grant, deduped by profile id.

**Write side** (`principals/actions.ts`): `promoteExistingToAdmin` no longer touches `profiles.role`/`school_id` at all — only `staff_members.permission_template_id`/`permission_template_name`. A promoted teacher's `profiles.role` stays `'teacher'` permanently: still shows up in "assign teacher" pickers (§2.2's original bug is now actually fixed, not just documented), keeps their teacher-only screens, and separately has admin access. `invitePrincipal` (brand-new admin accounts) is untouched — still writes `role = 'admin'` directly, which is why the enum itself was never dropped (§6, step 3).

**Known limitation, deliberately not fixed this pass — real Phase 4/5 territory:** a handful of places check `role === "teacher"` for scoping *after* already being let through an admin-or-teacher gate, and a teacher's literal role still matches that branch before the admin-grant fallback is ever consulted (the fallback only fires when the literal role check *fails*). So a promoted teacher gets full admin screens, but in these specific spots still gets teacher-scoped behavior:
- `subjects/attendance-actions.ts` — per-slot marking scoped to their own timetable slots, not unrestricted.
- `grades/actions.ts` marks-entry / `homework/[id]/page.tsx` `canEdit` — scoped to sections/homework they're personally assigned to.

This is exactly the "which identity am I acting as" question §4's switcher is meant to answer — until it exists, admin access is additive on top of these but doesn't override them. Two admin-*count* stats queries (`schools/page.tsx`, `schools/[id]/page.tsx`) also still filter on `profiles.role = 'admin'` — cosmetic undercount on a stats card, not a gate, left as-is.

Verified: `tsc --noEmit` clean, `eslint` 0 errors, two independent `next build` runs both exit 0.
