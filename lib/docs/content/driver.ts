import type { DocArticle } from "@/lib/docs/types";

export const DRIVER_ARTICLES: DocArticle[] = [
  {
    slug: "getting-started",
    title: "Getting started as a Driver",
    summary: "Log in for the first time and find your way around.",
    steps: [
      {
        heading: "Log in",
        body: [
          "Your school admin creates your account and shares your login details — sign in and set a new password on first login.",
        ],
      },
      {
        heading: "Find your way around",
        body: [
          "The sidebar covers My Routes, Attendance, Messages, and Leaves.",
          "The Overview page shows a quick summary of today's route and any recent messages.",
        ],
      },
    ],
  },
  {
    slug: "my-routes",
    title: "Viewing your assigned routes",
    summary: "See your route, stops, and the students riding with you.",
    steps: [
      {
        heading: "Open My Routes",
        body: [
          "Go to My Routes to see the transport route(s) assigned to you — stops in order, pickup/drop times, and the vehicle assigned.",
        ],
      },
      {
        heading: "Check your student list",
        body: [
          "Open a route to see the list of students assigned to it and which stop each one boards at.",
        ],
      },
    ],
    tips: [
      "If your route or vehicle looks wrong, contact your school admin — routes are set up under Transport on their side.",
    ],
  },
  {
    slug: "attendance",
    title: "Marking your attendance",
    summary: "Confirm your own daily attendance.",
    steps: [
      {
        heading: "Open Attendance",
        body: [
          "Go to Attendance and mark yourself present for the day, or view your attendance history.",
        ],
      },
    ],
  },
  {
    slug: "messages",
    title: "Messaging the school",
    summary: "Send and receive messages with school admin staff.",
    steps: [
      {
        heading: "Start a conversation",
        body: [
          "Go to Messages and click New Message to reach your school admin — for example, to flag a delay or a route issue.",
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
  {
    slug: "leaves",
    title: "Requesting leave",
    summary: "Submit a leave request and track its approval.",
    steps: [
      {
        heading: "Submit a request",
        body: [
          "Go to Leaves → New Request, pick the leave type, start and end dates, and add a short reason, then submit.",
        ],
      },
      {
        heading: "Track approval",
        body: [
          "Your request goes to your school admin. Its status (Pending, Approved, Rejected) updates on the same page, and you'll get a notification when it's actioned.",
        ],
      },
    ],
  },
];
