import Link from "next/link";
import { GraduationCap } from "lucide-react";

const links = {
  Product: ["Features", "Pricing", "Security", "Changelog"],
  Company: ["About", "Blog", "Careers", "Contact"],
  Roles: ["Super Admin", "Admin", "Teacher", "Parent", "Student"],
  Legal: ["Privacy Policy", "Terms of Service", "Cookie Policy"],
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
          </div>

          {Object.entries(links).map(([category, items]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4">{category}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item}>
                    <Link
                      href="#"
                      className="text-sm hover:text-white transition-colors"
                    >
                      {item}
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
