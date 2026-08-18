import { NextRequest, NextResponse } from "next/server";
import { uploadGalleryImage } from "@/app/dashboard/gallery/actions";

// Plain Route Handler (not a Server Action) so the client can drive the
// upload with XMLHttpRequest and get real `xhr.upload.onprogress` events —
// fetch-based Server Actions don't expose upload progress.
export async function POST(request: NextRequest) {
  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "Invalid form data" }, { status: 400 });

  try {
    await uploadGalleryImage(formData);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to upload image";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
