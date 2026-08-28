import { notFound } from "next/navigation";
import { MapPin, Phone, Mail, Megaphone, CalendarDays } from "lucide-react";
import { getPublicSiteSchools } from "@/lib/domains/public-site-data";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default async function PublicSitePage({ params }: { params: Promise<{ ownerId: string }> }) {
  const { ownerId } = await params;
  const schools = await getPublicSiteSchools(ownerId);
  if (schools.length === 0) notFound();

  const school = schools[0];
  const location = [school.address, school.city, school.state].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-white">
      <header className="border-b border-gray-100">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-6 py-6">
          {school.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={school.logoUrl} alt={school.name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-500 text-lg font-bold text-white">
              {school.name.slice(0, 1)}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900">{school.name}</h1>
            {school.tagline && <p className="text-sm text-gray-500">{school.tagline}</p>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10 space-y-10">
        <section className="flex flex-wrap gap-4 text-sm text-gray-600">
          {location && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary-500" /> {location}
            </span>
          )}
          {school.phone && (
            <a href={`tel:${school.phone}`} className="flex items-center gap-1.5 hover:text-primary-600">
              <Phone className="h-4 w-4 text-primary-500" /> {school.phone}
            </a>
          )}
          {school.email && (
            <a href={`mailto:${school.email}`} className="flex items-center gap-1.5 hover:text-primary-600">
              <Mail className="h-4 w-4 text-primary-500" /> {school.email}
            </a>
          )}
        </section>

        {school.announcements.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
              <Megaphone className="h-4 w-4" /> Announcements
            </h2>
            <div className="space-y-3">
              {school.announcements.map((a) => (
                <div key={a.id} className="rounded-xl border border-gray-100 p-4">
                  <p className="text-sm font-semibold text-gray-900">{a.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{a.content}</p>
                  <p className="mt-2 text-xs text-gray-400">{formatDate(a.createdAt)}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {school.events.length > 0 && (
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-400">
              <CalendarDays className="h-4 w-4" /> Upcoming Events
            </h2>
            <div className="space-y-3">
              {school.events.map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-xl border border-gray-100 p-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{e.title}</p>
                    {e.location && <p className="text-xs text-gray-400">{e.location}</p>}
                  </div>
                  <p className="text-sm text-gray-500">{formatDate(e.date)}</p>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-gray-100 py-6 text-center text-xs text-gray-400">
        Powered by Shikshaloy
      </footer>
    </div>
  );
}
