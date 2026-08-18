export type SupportRequestStatus = "open" | "in_review" | "resolved";
export type SupportSenderRole = "super_admin" | "kernel";

export interface SupportRequestSummary {
  id: string;
  institutionId: string;
  institutionName: string;
  category: string;
  subject: string;
  status: SupportRequestStatus;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
  lastMessagePreview: string;
  lastMessageAt: string;
}

export interface SupportMessage {
  id: string;
  senderRole: SupportSenderRole;
  senderName: string;
  senderEmail: string | null;
  body: string;
  createdAt: string;
}

export interface SupportRequestThread {
  id: string;
  institutionId: string;
  institutionName: string;
  category: string;
  subject: string;
  status: SupportRequestStatus;
  createdAt: string;
  messages: SupportMessage[];
}
