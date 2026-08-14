import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/service";
import { resolveKeyOwner, CORS_HEADERS } from "@/lib/publish-keys/resolve";

interface SchoolRow {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  board: string | null;
  established_year: number | null;
  principal_name: string | null;
}

interface AnnouncementRow {
  id: string;
  school_id: string;
  title: string;
  content: string;
  priority: string;
  expires_at: string | null;
  created_at: string;
}

interface EventRow {
  id: string;
  school_id: string;
  title: string;
  type: string;
  date: string;
  end_date: string | null;
  time: string | null;
  end_time: string | null;
  location: string | null;
  description: string | null;
  is_all_day: boolean;
}

interface FacultyRow {
  id: string;
  school_id: string;
  full_name: string;
  designation: string | null;
  department: string | null;
  photo_url: string | null;
  bio: string | null;
}

interface GalleryRow {
  id: string;
  school_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
}

interface BannerRow {
  id: string;
  school_id: string;
  image_url: string;
  display_order: number;
}

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: CORS_HEADERS });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(request: NextRequest) {
  const resolved = await resolveKeyOwner(request);
  if (!resolved) return jsonError("Invalid or revoked publish key", 401);

  const { data: institutionRows } = await supabaseAdmin
    .from("institutions")
    .select("id")
    .eq("owner_id", resolved.ownerId);
  const institutionIds = (institutionRows ?? []).map((i) => i.id);

  const { data: schoolRows } = institutionIds.length
    ? await supabaseAdmin
        .from("schools")
        .select(
          "id, name, tagline, logo_url, address, city, state, country, phone, email, website, board, established_year, principal_name"
        )
        .in("institution_id", institutionIds)
    : { data: [] as SchoolRow[] };

  const schools = (schoolRows ?? []) as SchoolRow[];
  const schoolIds = schools.map((s) => s.id);
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: announcementRows }, { data: eventRows }, { data: facultyRows }, { data: galleryRows }, { data: bannerRows }] =
    await Promise.all([
      schoolIds.length
        ? supabaseAdmin
            .from("announcements")
            .select("id, school_id, title, content, priority, expires_at, created_at")
            .in("school_id", schoolIds)
            .eq("is_public", true)
            .eq("status", "active")
            .or(`expires_at.is.null,expires_at.gte.${today}`)
        : Promise.resolve({ data: [] as AnnouncementRow[] }),
      schoolIds.length
        ? supabaseAdmin
            .from("school_events")
            .select("id, school_id, title, type, date, end_date, time, end_time, location, description, is_all_day")
            .in("school_id", schoolIds)
            .eq("is_public", true)
        : Promise.resolve({ data: [] as EventRow[] }),
      schoolIds.length
        ? supabaseAdmin
            .from("staff_members")
            .select("id, school_id, full_name, designation, department, photo_url, bio")
            .in("school_id", schoolIds)
            .eq("type", "teaching")
            .eq("status", "active")
        : Promise.resolve({ data: [] as FacultyRow[] }),
      schoolIds.length
        ? supabaseAdmin
            .from("school_gallery")
            .select("id, school_id, image_url, caption, display_order")
            .in("school_id", schoolIds)
            .order("display_order", { ascending: true })
        : Promise.resolve({ data: [] as GalleryRow[] }),
      schoolIds.length
        ? supabaseAdmin
            .from("school_banners")
            .select("id, school_id, image_url, display_order")
            .in("school_id", schoolIds)
            .order("display_order", { ascending: true })
        : Promise.resolve({ data: [] as BannerRow[] }),
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

  const announcementsBySchool = groupBySchool(announcementRows as AnnouncementRow[] | null);
  const eventsBySchool = groupBySchool(eventRows as EventRow[] | null);
  const facultyBySchool = groupBySchool(facultyRows as FacultyRow[] | null);
  const galleryBySchool = groupBySchool(galleryRows as GalleryRow[] | null);
  const bannersBySchool = groupBySchool(bannerRows as BannerRow[] | null);

  const responseSchools = schools.map((s) => ({
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
    banners: (bannersBySchool.get(s.id) ?? []).map((b) => ({
      id: b.id,
      imageUrl: b.image_url,
    })),
  }));

  return NextResponse.json({ schools: responseSchools }, { headers: CORS_HEADERS });
}
