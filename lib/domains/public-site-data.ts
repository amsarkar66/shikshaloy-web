import { supabaseAdmin } from "@/lib/supabase/service";

export interface PublicSiteSchool {
  id: string;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  phone: string | null;
  email: string | null;
  announcements: { id: string; title: string; content: string; createdAt: string }[];
  events: { id: string; title: string; date: string; location: string | null }[];
}

export async function getPublicSiteSchools(ownerId: string): Promise<PublicSiteSchool[]> {
  const { data: institutionRows } = await supabaseAdmin.from("institutions").select("id").eq("owner_id", ownerId);
  const institutionIds = (institutionRows ?? []).map((i) => i.id);
  if (institutionIds.length === 0) return [];

  const { data: schoolRows } = await supabaseAdmin
    .from("schools")
    .select("id, name, tagline, logo_url, address, city, state, phone, email")
    .in("institution_id", institutionIds);

  const schools = schoolRows ?? [];
  const schoolIds = schools.map((s) => s.id);
  if (schoolIds.length === 0) return [];

  const today = new Date().toISOString().slice(0, 10);

  const [{ data: announcementRows }, { data: eventRows }] = await Promise.all([
    supabaseAdmin
      .from("announcements")
      .select("id, school_id, title, content, created_at")
      .in("school_id", schoolIds)
      .eq("is_public", true)
      .eq("status", "active")
      .or(`expires_at.is.null,expires_at.gte.${today}`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabaseAdmin
      .from("school_events")
      .select("id, school_id, title, date, location")
      .in("school_id", schoolIds)
      .eq("is_public", true)
      .gte("date", today)
      .order("date", { ascending: true })
      .limit(5),
  ]);

  return schools.map((s) => ({
    id: s.id,
    name: s.name,
    tagline: s.tagline,
    logoUrl: s.logo_url,
    address: s.address,
    city: s.city,
    state: s.state,
    phone: s.phone,
    email: s.email,
    announcements: (announcementRows ?? [])
      .filter((a) => a.school_id === s.id)
      .map((a) => ({ id: a.id, title: a.title, content: a.content, createdAt: a.created_at })),
    events: (eventRows ?? [])
      .filter((e) => e.school_id === s.id)
      .map((e) => ({ id: e.id, title: e.title, date: e.date, location: e.location })),
  }));
}
