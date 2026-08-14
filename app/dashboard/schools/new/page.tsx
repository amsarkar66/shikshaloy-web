"use client";

import { SchoolOnboardingForm } from "@/app/onboarding/_school-onboarding-form";
import { createAdditionalSchool } from "../actions";

export default function AddSchoolPage() {
  return <SchoolOnboardingForm mode="additional-school" onSubmit={createAdditionalSchool} />;
}
