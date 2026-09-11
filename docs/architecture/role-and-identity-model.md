# Role & Identity Model — Design Notes

Status: **Design discussion, not yet implemented.**
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

1. **Additive schema**: add `access_role` to `staff_members`; backfill from current `profiles.role` (`admin` → `staff` + `access_role: admin`; `teacher` → `staff` + `type: teaching`; existing `staff` → `type: non_teaching` + existing `permission_template_id` value). Ship the promotion action on top of this without touching existing `requireRole` call sites yet (dual-running).
2. **Migrate call sites** (`requireRole`/`requireRoleOrStaffTemplate`/raw `role ===` checks, ~50 files) to read `access_role` instead of `profiles.role`, one file at a time, verifying each screen.
3. **Collapse** `profiles.role`'s `admin`/`teacher` values once nothing reads them; rework `dashboard/page.tsx` + `nav-data.ts` to be capability-composed instead of a single switch.
4. **Build the identity resolver + switchers** (§4.3–4.5): `getIdentitiesForProfile`, `ACTIVE_IDENTITY_COOKIE`, profile-modal UI. Independent of steps 1–3 in principle, but easier once `access_role` composition already exists for the Staff case.
5. Surface "My Children" (or the generalized identity switcher, once built) for any profile with a linked `parents` row — closes the gap found in §2.3 as a side effect of step 4.
