"use server";

import { supabaseAdmin } from "@/lib/supabase/service";

export interface ContactFormData {
  name: string;
  email: string;
  topic: string;
  message: string;
}

const TOPICS = ["sales", "support", "demo", "other"];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function submitContactForm(
  input: ContactFormData
): Promise<{ error?: string }> {
  const name = input.name.trim();
  const email = input.email.trim();
  const message = input.message.trim();
  const topic = TOPICS.includes(input.topic) ? input.topic : "other";

  if (!name || !email || !message) {
    return { error: "Please fill in your name, email, and message." };
  }
  if (!EMAIL_RE.test(email)) {
    return { error: "Please enter a valid email address." };
  }

  const { error } = await supabaseAdmin.from("contact_submissions").insert({
    name,
    email,
    topic,
    message,
  });

  if (error) {
    return { error: "Something went wrong. Please try again or email us directly." };
  }

  return {};
}
