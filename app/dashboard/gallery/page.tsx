import { redirect } from "next/navigation";

// Gallery management now lives inside the Website page (see
// app/dashboard/website/_components/sections/GallerySection.tsx), which
// reuses the actions in ./actions.ts. This route stays as a redirect for
// anyone with the old URL bookmarked.
export default function GalleryPage() {
  redirect("/dashboard/website?section=gallery");
}
