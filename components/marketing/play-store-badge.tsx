const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.shikshaloy.edu";

export function PlayStoreBadge({
  className = "",
  size = "md",
}: {
  className?: string;
  size?: "sm" | "md";
}) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Get Shikshaloy on Google Play"
      className={`inline-block ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png"
        alt="Get it on Google Play"
        className={size === "sm" ? "h-9 w-auto" : "h-12 w-auto"}
      />
    </a>
  );
}
