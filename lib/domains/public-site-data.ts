import { cache } from "react";
import { supabaseAdmin } from "@/lib/supabase/service";

export interface PublicAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: "urgent" | "normal" | "info";
  expiresAt: string | null;
  createdAt: string;
}

export interface PublicEvent {
  id: string;
  title: string;
  type: "holiday" | "exam" | "meeting" | "sports" | "cultural" | "workshop" | "other";
  date: string;
  endDate: string | null;
  time: string | null;
  endTime: string | null;
  location: string | null;
  description: string | null;
  isAllDay: boolean;
}

export interface PublicFaculty {
  id: string;
  fullName: string;
  designation: string | null;
  department: string | null;
  photoUrl: string | null;
  bio: string | null;
}

export interface PublicGalleryImage {
  id: string;
  imageUrl: string;
  caption: string | null;
}

export interface PublicBanner {
  id: string;
  imageUrl: string;
}

export interface PublicSchool {
  id: string;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  banners: PublicBanner[];
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  board: string | null;
  establishedYear: number | null;
  principalName: string | null;
  announcements: PublicAnnouncement[];
  events: PublicEvent[];
  faculty: PublicFaculty[];
  gallery: PublicGalleryImage[];
}

// Cached per-request — the layout and each page under /public-site/[ownerId]
// independently call this, so this avoids re-querying the DB for every one
// of them during a single request.
export const getPublicSiteSchools = cache(async (ownerId: string): Promise<PublicSchool[]> => {
  const { data: institutionRows } = await supabaseAdmin.from("institutions").select("id").eq("owner_id", ownerId);
  const institutionIds = (institutionRows ?? []).map((i) => i.id);
  if (institutionIds.length === 0) return [];

  const { data: schoolRows } = await supabaseAdmin
    .from("schools")
    .select(
      "id, name, tagline, logo_url, address, city, state, country, phone, email, website, board, established_year, principal_name"
    )
    .in("institution_id", institutionIds);

  const schools = schoolRows ?? [];
  const schoolIds = schools.map((s) => s.id);
  if (schoolIds.length === 0) return [];

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: announcementRows }, { data: eventRows }, { data: facultyRows }, { data: galleryRows }, { data: bannerRows }] =
    await Promise.all([
      supabaseAdmin
        .from("announcements")
        .select("id, school_id, title, content, priority, expires_at, created_at")
        .in("school_id", schoolIds)
        .eq("is_public", true)
        .eq("status", "active")
        .or(`expires_at.is.null,expires_at.gte.${today}`),
      supabaseAdmin
        .from("school_events")
        .select("id, school_id, title, type, date, end_date, time, end_time, location, description, is_all_day")
        .in("school_id", schoolIds)
        .eq("is_public", true),
      supabaseAdmin
        .from("staff_members")
        .select("id, school_id, full_name, designation, department, photo_url, bio")
        .in("school_id", schoolIds)
        .eq("type", "teaching")
        .eq("status", "active"),
      supabaseAdmin
        .from("school_gallery")
        .select("id, school_id, image_url, caption, display_order")
        .in("school_id", schoolIds)
        .order("display_order", { ascending: true }),
      supabaseAdmin
        .from("school_banners")
        .select("id, school_id, image_url, display_order")
        .in("school_id", schoolIds)
        .order("display_order", { ascending: true }),
    ]);

  function groupBySchool<T extends { school_id: string }>(rows: T[] | null): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const row of rows ?? []) {
      const list = map.get(row.school_id) ?? [];
      list.push(row);
      map.set(row.school_id, list);
    }
    return map;
  }

  const announcementsBySchool = groupBySchool(announcementRows);
  const eventsBySchool = groupBySchool(eventRows);
  const facultyBySchool = groupBySchool(facultyRows);
  const galleryBySchool = groupBySchool(galleryRows);
  const bannersBySchool = groupBySchool(bannerRows);

  return schools.map((s) => ({
    id: s.id,
    name: s.name,
    tagline: s.tagline,
    logoUrl: s.logo_url,
    address: s.address,
    city: s.city,
    state: s.state,
    country: s.country,
    phone: s.phone,
    email: s.email,
    website: s.website,
    board: s.board,
    establishedYear: s.established_year,
    principalName: s.principal_name,
    banners: (bannersBySchool.get(s.id) ?? []).map((b) => ({ id: b.id, imageUrl: b.image_url })),
    announcements: (announcementsBySchool.get(s.id) ?? []).map((a) => ({
      id: a.id,
      title: a.title,
      content: a.content,
      priority: a.priority,
      expiresAt: a.expires_at,
      createdAt: a.created_at,
    })),
    events: (eventsBySchool.get(s.id) ?? []).map((e) => ({
      id: e.id,
      title: e.title,
      type: e.type,
      date: e.date,
      endDate: e.end_date,
      time: e.time,
      endTime: e.end_time,
      location: e.location,
      description: e.description,
      isAllDay: e.is_all_day,
    })),
    faculty: (facultyBySchool.get(s.id) ?? []).map((f) => ({
      id: f.id,
      fullName: f.full_name,
      designation: f.designation,
      department: f.department,
      photoUrl: f.photo_url,
      bio: f.bio,
    })),
    gallery: (galleryBySchool.get(s.id) ?? []).map((g) => ({
      id: g.id,
      imageUrl: g.image_url,
      caption: g.caption,
    })),
  }));
});
