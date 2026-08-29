import { MapPin, Phone, Mail, Globe, Calendar, User, GraduationCap } from "lucide-react";
import type { PublicSchool } from "@/lib/domains/public-site-data";
import { Reveal, RevealStagger, RevealItem } from "./Reveal";

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <p className="mt-0.5 text-sm text-gray-800">{value}</p>
      </div>
    </div>
  );
}

export function About({ school }: { school: PublicSchool }) {
  const address = [school.address, school.city, school.state, school.country].filter(Boolean).join(", ");

  const cards: { icon: React.ElementType; label: string; value: string }[] = [];
  if (address) cards.push({ icon: MapPin, label: "Address", value: address });
  if (school.phone) cards.push({ icon: Phone, label: "Phone", value: school.phone });
  if (school.email) cards.push({ icon: Mail, label: "Email", value: school.email });
  if (school.website) cards.push({ icon: Globe, label: "Website", value: school.website });
  if (school.principalName) cards.push({ icon: User, label: "Principal", value: school.principalName });
  if (school.establishedYear) cards.push({ icon: Calendar, label: "Established", value: String(school.establishedYear) });
  if (school.board) cards.push({ icon: GraduationCap, label: "Board", value: school.board });

  if (cards.length === 0) return null;

  return (
    <section id="about" className="mx-auto max-w-5xl px-6 py-16">
      <Reveal>
        <h2 className="text-2xl font-bold text-gray-900">About Us</h2>
      </Reveal>
      <RevealStagger className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((c) => (
          <RevealItem key={c.label}>
            <InfoCard {...c} />
          </RevealItem>
        ))}
      </RevealStagger>
    </section>
  );
}
