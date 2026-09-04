import {
  Building2,
  Landmark,
  BookOpen,
  Heart,
  GraduationCap,
  Bus,
  Briefcase,
} from "lucide-react";
import type { DocRole } from "@/lib/docs/types";
import { SUPER_ADMIN_ARTICLES } from "@/lib/docs/content/super-admin";
import { ADMIN_ARTICLES } from "@/lib/docs/content/admin";
import { TEACHER_ARTICLES } from "@/lib/docs/content/teacher";
import { PARENT_ARTICLES } from "@/lib/docs/content/parent";
import { STUDENT_ARTICLES } from "@/lib/docs/content/student";
import { DRIVER_ARTICLES } from "@/lib/docs/content/driver";
import { STAFF_ARTICLES } from "@/lib/docs/content/staff";

export const DOC_ROLES: DocRole[] = [
  {
    slug: "super-admin",
    label: "Institution Owner (Super Admin)",
    shortLabel: "Super Admin",
    description: "Runs the institution — manages every school, staff, finances, and settings.",
    icon: Building2,
    colorClass: "text-violet-600 bg-violet-100",
    articles: SUPER_ADMIN_ARTICLES,
  },
  {
    slug: "admin",
    label: "Principal / School Admin",
    shortLabel: "Admin",
    description: "Runs the day-to-day of a single school — people, academics, finance, and facilities.",
    icon: Landmark,
    colorClass: "text-blue-600 bg-blue-100",
    articles: ADMIN_ARTICLES,
  },
  {
    slug: "teacher",
    label: "Teacher",
    shortLabel: "Teacher",
    description: "Teaches classes — attendance, grades, homework, and parent communication.",
    icon: BookOpen,
    colorClass: "text-emerald-600 bg-emerald-100",
    articles: TEACHER_ARTICLES,
  },
  {
    slug: "parent",
    label: "Parent",
    shortLabel: "Parent",
    description: "Follows a child's progress, pays fees, and stays in touch with school staff.",
    icon: Heart,
    colorClass: "text-rose-600 bg-rose-100",
    articles: PARENT_ARTICLES,
  },
  {
    slug: "student",
    label: "Student",
    shortLabel: "Student",
    description: "Checks classes, attendance, grades, homework, and the timetable.",
    icon: GraduationCap,
    colorClass: "text-sky-600 bg-sky-100",
    articles: STUDENT_ARTICLES,
  },
  {
    slug: "driver",
    label: "Driver",
    shortLabel: "Driver",
    description: "Manages assigned transport routes and daily attendance.",
    icon: Bus,
    colorClass: "text-teal-600 bg-teal-100",
    articles: DRIVER_ARTICLES,
  },
  {
    slug: "staff",
    label: "Support Staff",
    shortLabel: "Staff",
    description: "Accountants, librarians, wardens, HR, front desk, and lab staff — role-specific tools.",
    icon: Briefcase,
    colorClass: "text-orange-600 bg-orange-100",
    articles: STAFF_ARTICLES,
  },
];

export function getDocRole(slug: string): DocRole | undefined {
  return DOC_ROLES.find((r) => r.slug === slug);
}

export function getDocArticle(roleSlug: string, articleSlug: string) {
  const role = getDocRole(roleSlug);
  const article = role?.articles.find((a) => a.slug === articleSlug);
  return role && article ? { role, article } : undefined;
}
