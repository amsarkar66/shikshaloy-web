export type ContactRole = "teacher" | "staff" | "parent";

export interface MessageEntry {
  id: number;
  from: "me" | "them";
  text: string;
  time: string; // ISO
}

export interface Conversation {
  id: number;
  name: string;
  role: ContactRole;
  detail: string;
  lastMessage: string;
  lastTime: string; // ISO
  unread: number;
  online: boolean;
  messages: MessageEntry[];
}

export const ALL_CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    name: "Priya Patel",
    role: "parent",
    detail: "Parent · Arjun Mehta (Class 5B)",
    lastMessage: "Please confirm when convenient.",
    lastTime: "2026-06-23T10:05:00",
    unread: 3,
    online: true,
    messages: [
      { id: 1, from: "them", text: "Hello sir, this is Priya Patel, Arjun's mother. I wanted to ask about the June fee payment.", time: "2026-06-23T09:40:00" },
      { id: 2, from: "me",   text: "Hello Mrs. Patel. Of course — what would you like to know?", time: "2026-06-23T09:43:00" },
      { id: 3, from: "them", text: "I paid online yesterday but haven't received a receipt yet.", time: "2026-06-23T09:48:00" },
      { id: 4, from: "me",   text: "Let me check with accounts. Could you share your transaction ID?", time: "2026-06-23T09:51:00" },
      { id: 5, from: "them", text: "Yes, it's TXN-2026-89421.", time: "2026-06-23T10:02:00" },
      { id: 6, from: "them", text: "I've also emailed the payment screenshot to the school ID.", time: "2026-06-23T10:04:00" },
      { id: 7, from: "them", text: "Please confirm when convenient.", time: "2026-06-23T10:05:00" },
    ],
  },
  {
    id: 2,
    name: "Prakash Iyer",
    role: "staff",
    detail: "IT Coordinator",
    lastMessage: "New fee payment module is live on the portal.",
    lastTime: "2026-06-23T11:30:00",
    unread: 1,
    online: true,
    messages: [
      { id: 1, from: "me",   text: "Prakash, when will the portal upgrade be ready?", time: "2026-06-23T10:00:00" },
      { id: 2, from: "them", text: "Sir, we're completing final testing now. Should be live by noon.", time: "2026-06-23T10:10:00" },
      { id: 3, from: "me",   text: "Great. Let me know once it's up.", time: "2026-06-23T10:12:00" },
      { id: 4, from: "them", text: "New fee payment module is live on the portal.", time: "2026-06-23T11:30:00" },
    ],
  },
  {
    id: 3,
    name: "Mrs. Kavita Sharma",
    role: "teacher",
    detail: "Class Teacher · Grade 7A",
    lastMessage: "Should I mark them zero for the project?",
    lastTime: "2026-06-23T09:42:00",
    unread: 2,
    online: false,
    messages: [
      { id: 1, from: "them", text: "Good morning sir. Ravi Kumar in 7A has been absent for 3 consecutive days.", time: "2026-06-23T08:05:00" },
      { id: 2, from: "me",   text: "Please fill in the absence alert form and I'll have the admin office contact the family today.", time: "2026-06-23T08:20:00" },
      { id: 3, from: "them", text: "Done sir, form submitted. Thank you.", time: "2026-06-23T08:35:00" },
      { id: 4, from: "me",   text: "Good. Keep monitoring and update me by end of week.", time: "2026-06-23T08:40:00" },
      { id: 5, from: "them", text: "Sure sir. Also, two students haven't submitted their project — deadline was yesterday.", time: "2026-06-23T09:38:00" },
      { id: 6, from: "them", text: "Should I mark them zero for the project?", time: "2026-06-23T09:42:00" },
    ],
  },
  {
    id: 4,
    name: "Mrs. Deepa Singh",
    role: "staff",
    detail: "Accounts Dept.",
    lastMessage: "One increment for Mr. Suresh Menon as per HR.",
    lastTime: "2026-06-23T07:55:00",
    unread: 1,
    online: true,
    messages: [
      { id: 1, from: "them", text: "Sir, the June payroll is ready for your approval.", time: "2026-06-23T07:40:00" },
      { id: 2, from: "me",   text: "I'll review and approve by end of day. Any changes from last month?", time: "2026-06-23T07:50:00" },
      { id: 3, from: "them", text: "One increment for Mr. Suresh Menon as per HR.", time: "2026-06-23T07:55:00" },
    ],
  },
  {
    id: 5,
    name: "Mr. Rajesh Kumar",
    role: "staff",
    detail: "Vice Principal",
    lastMessage: "Revised timetable sent to your email, sir.",
    lastTime: "2026-06-23T08:15:00",
    unread: 0,
    online: true,
    messages: [
      { id: 1, from: "me",   text: "Rajesh, have you reviewed the half-yearly exam timetable draft?", time: "2026-06-22T16:00:00" },
      { id: 2, from: "them", text: "Yes sir, looks good. There's one overlap on July 11 between Class 9 and 10 for Maths.", time: "2026-06-22T16:20:00" },
      { id: 3, from: "me",   text: "Please fix that and send me the revised version.", time: "2026-06-22T16:30:00" },
      { id: 4, from: "them", text: "Will send by 4 PM today.", time: "2026-06-22T16:32:00" },
      { id: 5, from: "them", text: "Revised timetable sent to your email, sir.", time: "2026-06-23T08:15:00" },
    ],
  },
  {
    id: 6,
    name: "Mr. Suresh Menon",
    role: "teacher",
    detail: "Mathematics · Classes 9 & 10",
    lastMessage: "I'll speak with the librarian today about past papers.",
    lastTime: "2026-06-22T16:30:00",
    unread: 0,
    online: false,
    messages: [
      { id: 1, from: "them", text: "Sir, Class 10 board prep class registrations are going well — 38 of 45 students have signed up.", time: "2026-06-22T14:00:00" },
      { id: 2, from: "me",   text: "That's great. Please follow up with the remaining 7 students' parents.", time: "2026-06-22T14:10:00" },
      { id: 3, from: "them", text: "Will do. Should we also arrange past years' question papers for practice?", time: "2026-06-22T14:20:00" },
      { id: 4, from: "me",   text: "Yes, coordinate with the library for printed sets.", time: "2026-06-22T16:10:00" },
      { id: 5, from: "them", text: "I'll speak with the librarian today about past papers.", time: "2026-06-22T16:30:00" },
    ],
  },
  {
    id: 7,
    name: "Mr. Akhil Nair",
    role: "parent",
    detail: "Parent · Rhea Nair (Class 9B)",
    lastMessage: "We'll evaluate feasibility and get back within 2 days.",
    lastTime: "2026-06-22T14:20:00",
    unread: 0,
    online: false,
    messages: [
      { id: 1, from: "them", text: "Good afternoon sir, I'm Akhil Nair, Rhea's father from Class 9B.", time: "2026-06-22T13:00:00" },
      { id: 2, from: "me",   text: "Hello Mr. Nair, how can I help?", time: "2026-06-22T13:10:00" },
      { id: 3, from: "them", text: "I was wondering if we could add a stop on Bus Route 3 near Green Park Colony.", time: "2026-06-22T13:15:00" },
      { id: 4, from: "me",   text: "I'll speak with the transport coordinator. Could you share the exact location?", time: "2026-06-22T13:30:00" },
      { id: 5, from: "them", text: "Green Park Colony, Gate 4, near the water tank.", time: "2026-06-22T13:45:00" },
      { id: 6, from: "me",   text: "We'll evaluate feasibility and get back within 2 days.", time: "2026-06-22T14:20:00" },
    ],
  },
  {
    id: 8,
    name: "Mrs. Anita Joshi",
    role: "teacher",
    detail: "Science · Classes 8 & 9",
    lastMessage: "Thank you for flagging it, we'll add to the maintenance request.",
    lastTime: "2026-06-21T11:00:00",
    unread: 0,
    online: false,
    messages: [
      { id: 1, from: "them", text: "Sir, the chemistry lab is short on a few reagents needed for the Class 9 experiment next week.", time: "2026-06-21T09:30:00" },
      { id: 2, from: "me",   text: "Please send me the full list and I'll forward it to the purchase committee.", time: "2026-06-21T09:45:00" },
      { id: 3, from: "them", text: "Shared the list on email just now. Also, the Bunsen burners need servicing — two aren't igniting properly.", time: "2026-06-21T10:00:00" },
      { id: 4, from: "me",   text: "Thank you for flagging it, we'll add to the maintenance request.", time: "2026-06-21T11:00:00" },
    ],
  },
  {
    id: 9,
    name: "Mrs. Sunita Verma",
    role: "parent",
    detail: "Parent · Rohit Verma (Class 9A)",
    lastMessage: "We'll definitely be there. Thank you so much, sir.",
    lastTime: "2026-06-17T18:30:00",
    unread: 0,
    online: false,
    messages: [
      { id: 1, from: "them", text: "Good evening sir, congratulations to Rohit for winning the Science Olympiad! We're so proud.", time: "2026-06-17T17:45:00" },
      { id: 2, from: "me",   text: "Thank you Mrs. Verma! Rohit truly deserves it — we're all very proud of him at school.", time: "2026-06-17T18:00:00" },
      { id: 3, from: "them", text: "Will there be a felicitation ceremony?", time: "2026-06-17T18:10:00" },
      { id: 4, from: "me",   text: "Yes, on June 27 during the morning assembly. Please do attend — we'd love to have you there.", time: "2026-06-17T18:20:00" },
      { id: 5, from: "them", text: "We'll definitely be there. Thank you so much, sir.", time: "2026-06-17T18:30:00" },
    ],
  },
  {
    id: 10,
    name: "Miss Roopa Bhat",
    role: "staff",
    detail: "Librarian",
    lastMessage: "Please send reminder notices to those students.",
    lastTime: "2026-06-20T16:45:00",
    unread: 0,
    online: false,
    messages: [
      { id: 1, from: "them", text: "Sir, the updated library catalogue is now live on the school portal.", time: "2026-06-20T15:30:00" },
      { id: 2, from: "me",   text: "Great, I noticed the announcement. Good work getting it done on time.", time: "2026-06-20T15:45:00" },
      { id: 3, from: "them", text: "Thank you sir. Also, we have 12 overdue books from last term still not returned.", time: "2026-06-20T16:00:00" },
      { id: 4, from: "me",   text: "Please send reminder notices to those students.", time: "2026-06-20T16:45:00" },
    ],
  },
];

// ── Display helpers ───────────────────────────────────────────────────────────

export const ROLE_LABEL: Record<ContactRole, string> = {
  teacher: "Teacher",
  staff:   "Staff",
  parent:  "Parent",
};

export const ROLE_BADGE: Record<ContactRole, string> = {
  teacher: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  staff:   "bg-orange-500/10  text-orange-600  dark:text-orange-400",
  parent:  "bg-rose-500/10    text-rose-600    dark:text-rose-400",
};

export const ROLE_AVATAR: Record<ContactRole, string> = {
  teacher: "bg-emerald-500",
  staff:   "bg-orange-500",
  parent:  "bg-rose-500",
};

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", {
    hour: "2-digit", minute: "2-digit",
  });
}

export function formatRelativeDate(iso: string): string {
  const d    = new Date(iso);
  const now  = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diff  = Math.round((today.getTime() - msgDay.getTime()) / 86_400_000);

  if (diff === 0) return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (diff === 1) return "Yesterday";
  if (diff < 7)  return d.toLocaleDateString("en-IN", { weekday: "short" });
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}
