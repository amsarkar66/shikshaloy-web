import type { DocArticle } from "@/lib/docs/types";

export const PARENT_ARTICLES: DocArticle[] = [
  {
    slug: "getting-started",
    title: "Getting started as a Parent",
    summary: "Log in for the first time and find your way around.",
    steps: [
      {
        heading: "Log in",
        body: [
          "Your child's school creates your account when they're enrolled, and sends a login email and temporary password to the contact details on file.",
          "Sign in and set a new password on first login.",
        ],
      },
      {
        heading: "Find your way around",
        body: [
          "The sidebar covers My Children, PTM, Messages, Fees, and Reports.",
          "The Overview page gives you a quick summary — recent attendance, announcements, and anything needing your attention.",
        ],
      },
    ],
  },
  {
    slug: "my-children",
    title: "Your children's profiles",
    summary: "View each linked child's profile and switch between them.",
    steps: [
      {
        heading: "Open My Children",
        body: [
          "Go to My Children to see every child linked to your account, with their class, section, and school.",
        ],
      },
      {
        heading: "Switch between children",
        body: [
          "If you have more than one child at the school, use the child selector to switch which one's attendance, grades, and fees you're viewing.",
        ],
      },
    ],
    tips: [
      "If a child is missing from your account, contact the school office — they'll link the profile to your account from their side.",
    ],
  },
  {
    slug: "fees",
    title: "Paying fees online",
    summary: "View what's due and pay directly from the dashboard.",
    steps: [
      {
        heading: "View dues",
        body: [
          "Go to Fees to see the fee structure for your child, what's already paid, and what's currently due.",
        ],
      },
      {
        heading: "Pay online",
        body: [
          "Click Pay Now next to a due amount and complete payment through the secure payment page.",
          "A receipt is generated automatically and added to your payment history once payment goes through.",
        ],
      },
    ],
  },
  {
    slug: "reports",
    title: "Viewing report cards & progress",
    summary: "Check grades, attendance, and report cards for your child.",
    steps: [
      {
        heading: "Open Reports",
        body: [
          "Go to Reports to see your child's attendance summary and grades for the current term.",
        ],
      },
      {
        heading: "Download a report card",
        body: [
          "Once a school has published results for an exam, a downloadable report card appears here — click to view or download it as a PDF.",
        ],
      },
    ],
  },
  {
    slug: "ptm",
    title: "Parent-teacher meetings",
    summary: "Book a slot with your child's teacher.",
    steps: [
      {
        heading: "Book a slot",
        body: [
          "Go to PTM to see available time slots from your child's teachers during a scheduled meeting window.",
          "Pick a slot that works for you to confirm your booking.",
        ],
      },
      {
        heading: "Manage your bookings",
        body: [
          "Your upcoming meetings are listed on the same page — cancel or rebook if your plans change and slots are still open.",
        ],
      },
    ],
  },
  {
    slug: "messages",
    title: "Messaging teachers & school",
    summary: "Send and receive messages inside the platform.",
    steps: [
      {
        heading: "Start a conversation",
        body: [
          "Go to Messages and click New Message, then search for your child's teacher or the school office.",
        ],
      },
      {
        heading: "Stay on top of replies",
        body: [
          "Unread conversations are bolded in your inbox, and you'll get an email notification for new messages by default.",
        ],
      },
    ],
  },
];
