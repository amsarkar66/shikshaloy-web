import { Globe } from "lucide-react";

export default function DomainNotConnectedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center">
      <Globe className="h-10 w-10 text-gray-300" />
      <p className="text-lg font-semibold text-gray-900">This domain isn&apos;t connected yet</p>
      <p className="max-w-sm text-sm text-gray-500">
        If you&apos;re the site owner, check your domain&apos;s connection status in Shikshaloy under Settings → Institution.
      </p>
    </div>
  );
}
