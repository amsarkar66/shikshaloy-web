"use client";

import { useState } from "react";
import { Users, HelpCircle, Phone, DoorOpen, Mail } from "lucide-react";
import VisitorsTab from "./VisitorsTab";
import EnquiriesTab from "./EnquiriesTab";
import CallLogTab from "./CallLogTab";
import GatePassTab from "./GatePassTab";
import PostalTab from "./PostalTab";
import { PageSchoolPicker } from "../../_components/page-school-picker";
import type { InstitutionSchool } from "@/lib/supabase/institution-context";

export interface VisitorEntry {
  id: string; visitorName: string; phone: string | null; purpose: string;
  meetingWith: string | null; inTime: string; outTime: string | null;
}
export interface EnquiryEntry {
  id: string; name: string; phone: string | null; email: string | null;
  interestedGrade: string | null; source: string | null; notes: string | null;
  status: "new" | "contacted" | "converted" | "closed"; createdAt: string;
}
export interface CallLogEntry {
  id: string; callerName: string; phone: string | null; direction: "incoming" | "outgoing";
  purpose: string | null; notes: string | null; createdAt: string;
}
export interface GatePassEntry {
  id: string; studentName: string; studentRollNo: string; reason: string;
  pickupPersonName: string; pickupPersonRelation: string | null; passTime: string;
}
export interface PostalEntry {
  id: string; direction: "dispatch" | "receive"; referenceNo: string | null; subject: string;
  contactName: string | null; recordDate: string; notes: string | null;
}

type Tab = "visitors" | "enquiries" | "calls" | "gatepass" | "postal";

const TABS: { value: Tab; label: string; icon: React.ElementType }[] = [
  { value: "visitors",  label: "Visitor Log",  icon: Users },
  { value: "enquiries", label: "Enquiries",    icon: HelpCircle },
  { value: "calls",     label: "Call Log",     icon: Phone },
  { value: "gatepass",  label: "Gate Pass",    icon: DoorOpen },
  { value: "postal",    label: "Postal",       icon: Mail },
];

export default function FrontDeskClient({
  visitors, enquiries, calls, gatePasses, postal, schools = [], activeSchoolId = null,
}: {
  visitors: VisitorEntry[];
  enquiries: EnquiryEntry[];
  calls: CallLogEntry[];
  gatePasses: GatePassEntry[];
  postal: PostalEntry[];
  schools?: InstitutionSchool[];
  activeSchoolId?: string | null;
}) {
  const [tab, setTab] = useState<Tab>("visitors");

  return (
    <div className="w-full px-6 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div>
          <h1 className="text-lg font-bold text-gray-900 dark:text-zinc-50">Front Desk</h1>
          <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">Visitors, enquiries, calls, gate passes, and postal register</p>
        </div>
        <div className="sm:ml-auto">
          <PageSchoolPicker schools={schools} activeSchoolId={activeSchoolId} />
        </div>
      </div>

      <div className="flex gap-1 border-b border-gray-200 dark:border-zinc-800 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
              tab === t.value
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-zinc-100 hover:border-gray-300 dark:hover:border-zinc-600"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === "visitors" && <VisitorsTab initialVisitors={visitors} />}
      {tab === "enquiries" && <EnquiriesTab initialEnquiries={enquiries} />}
      {tab === "calls" && <CallLogTab initialCalls={calls} />}
      {tab === "gatepass" && <GatePassTab initialGatePasses={gatePasses} />}
      {tab === "postal" && <PostalTab initialPostal={postal} />}
    </div>
  );
}
