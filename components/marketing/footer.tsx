import Link from "next/link";
import { GraduationCap } from "lucide-react";

const links = {
  Product: [
    { label: "Features", href: "/features" },
    { label: "Pricing", href: "/pricing" },
    { label: "Live Demo", href: "/demo" },
  ],
  Company: [
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ],
  Roles: [
    { label: "Super Admin", href: "/demo#super_admin" },
    { label: "Admin", href: "/demo#admin" },
    { label: "Teacher", href: "/demo#teacher" },
    { label: "Staff", href: "/demo#staff" },
    { label: "Student", href: "/demo#student" },
    { label: "Parent", href: "/demo#parent" },
    { label: "Driver", href: "/demo#driver" },
  ],
  Legal: [
    { label: "Privacy Policy", href: "/privacy" },
    { label: "Terms of Service", href: "/terms" },
    { label: "Account Deletion", href: "/account-deletion" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-primary-950 text-primary-300 border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-b from-primary-400 to-primary-500 shadow-[0_2px_0_0_var(--color-primary-700)]">
                <GraduationCap className="h-4.5 w-4.5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">Shikshaloy</span>
            </Link>
            <p className="text-sm leading-relaxed">
              Modern school management for the schools of tomorrow.
            </p>
            <p className="mt-4 text-sm leading-relaxed">
              <a href="mailto:support@shikshaloy.com" className="hover:text-white transition-colors">
                support@shikshaloy.com
              </a>
              <br />
              <a href="tel:+919932797131" className="hover:text-white transition-colors">
                +91 99327 97131
              </a>
            </p>
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm hover:text-white transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm">
            © {new Date().getFullYear()} Shikshaloy. All rights reserved.
          </p>
          <p className="text-sm">
            Built with ❤️ for better education
          </p>
        </div>
      </div>
    </footer>
  );
}
