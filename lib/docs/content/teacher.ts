import type { DocArticle } from "@/lib/docs/types";

export const TEACHER_ARTICLES: DocArticle[] = [
  {
    slug: "getting-started",
    title: "Getting started as a Teacher",
    summary: "Log in for the first time and get oriented in your dashboard.",
    steps: [
      {
        heading: "Log in",
        body: [
          "Your school's admin creates your account and sends your login email and a temporary password to your registered email address.",
          "Go to your school's Shikshaloy login page (or shikshaloy.com/login) and sign in with those credentials.",
          "You'll be asked to set a new password on first login — choose one only you know.",
        ],
      },
      {
        heading: "Find your way around",
        body: [
          "The left sidebar is your main menu: My Classes, Attendance, Grades, Homework, Timetable, PTM, Messages, and Leaves.",
          "The Overview page shows a quick summary — today's classes, pending homework to grade, and recent messages.",
          "If your school has more than one campus, use the school switcher at the top of the sidebar to confirm you're viewing the right one.",
        ],
      },
      {
        heading: "Complete your profile",
        body: [
          "Click your avatar in the top-right corner to open your profile.",
          "Add a photo and double-check your contact details — parents and admin staff see this information.",
        ],
      },
    ],
  },
  {
    slug: "my-classes",
    title: "Viewing your classes and students",
    summary: "See the classes and sections you teach and each student's profile.",
    steps: [
      {
        heading: "Open My Classes",
        body: [
          "Go to My Classes in the sidebar. You'll see every class and section your school has assigned you to teach.",
        ],
      },
      {
        heading: "Browse a class roster",
        body: [
          "Click a class to open its student list.",
          "Click any student's name to view their full profile — contact details, guardian info, and academic history for the subjects you teach them.",
        ],
      },
    ],
    tips: [
      "If a class you teach is missing, ask your school admin to check your subject/class assignment under Classes & Sections.",
    ],
  },
  {
    slug: "attendance",
    title: "Marking attendance",
    summary: "Take daily attendance for each class in a couple of taps.",
    steps: [
      {
        heading: "Open the Attendance page",
        body: [
          "Go to Attendance in the sidebar and pick the class, section, and date.",
        ],
      },
      {
        heading: "Mark each student",
        body: [
          "Every student defaults to Present. Tap a student to cycle to Absent, Late, or Excused.",
          "Use the search box to jump straight to a specific student in a large class.",
        ],
      },
      {
        heading: "Save",
        body: [
          "Click Save Attendance once you're done. You can reopen the same date later the same day to make corrections.",
        ],
      },
    ],
    tips: [
      "Parents are notified automatically when their child is marked absent, so double-check before saving.",
    ],
  },
  {
    slug: "grades",
    title: "Entering grades and results",
    summary: "Record marks for exams and assessments so report cards can be generated.",
    steps: [
      {
        heading: "Open Grades",
        body: [
          "Go to Grades in the sidebar and choose the class, subject, and exam or assessment.",
        ],
      },
      {
        heading: "Enter marks",
        body: [
          "Type marks directly into the grid next to each student's name — you can also paste a column of values from a spreadsheet.",
          "Leave a cell blank and mark the student Absent if they didn't sit the exam.",
        ],
      },
      {
        heading: "Submit",
        body: [
          "Click Submit for Review once entry is complete. Depending on your school's settings, marks may need admin approval before appearing on report cards.",
        ],
      },
    ],
  },
  {
    slug: "homework",
    title: "Assigning and reviewing homework",
    summary: "Post homework to a class and review what students submit.",
    steps: [
      {
        heading: "Create an assignment",
        body: [
          "Go to Homework → New Assignment.",
          "Pick the class and subject, add a title, instructions, and a due date. Attach a file if needed (worksheet, reading, etc.).",
          "Click Publish — students and parents for that class are notified immediately.",
        ],
      },
      {
        heading: "Review submissions",
        body: [
          "Open the assignment to see who has submitted, who hasn't, and any late submissions.",
          "Click a submission to view the file or text a student sent in, and leave a grade or short comment.",
        ],
      },
    ],
  },
  {
    slug: "timetable",
    title: "Viewing your timetable",
    summary: "See your weekly teaching schedule.",
    steps: [
      {
        heading: "Open Timetable",
        body: [
          "Go to Timetable in the sidebar for a weekly grid of every period you teach, including room/section details.",
          "The timetable is set up by your school admin — reach out to them if you spot a scheduling conflict.",
        ],
      },
    ],
  },
  {
    slug: "ptm",
    title: "Parent-teacher meetings",
    summary: "Set your availability and meet with parents.",
    steps: [
      {
        heading: "Set your available slots",
        body: [
          "Go to PTM in the sidebar. If your school has scheduled a PTM window, add the time slots you're available.",
        ],
      },
      {
        heading: "Manage bookings",
        body: [
          "Parents book a slot directly from their side; you'll see each booking appear against your schedule with the parent's name and their child.",
          "Add private notes after a meeting for your own reference — parents don't see these.",
        ],
      },
    ],
  },
  {
    slug: "messages",
    title: "Messaging parents and staff",
    summary: "Send and receive messages inside the platform.",
    steps: [
      {
        heading: "Start a conversation",
        body: [
          "Go to Messages and click New Message.",
          "Search for a parent (by their child's name), another staff member, or a class group, then send your message.",
        ],
      },
      {
        heading: "Stay on top of replies",
        body: [
          "Unread conversations are bolded in your inbox. You'll also get an email notification for new messages by default.",
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
          "Go to Leaves → New Request.",
          "Pick the leave type, start and end dates, and add a short reason, then submit.",
        ],
      },
      {
        heading: "Track approval",
        body: [
          "Your request goes to your school admin. Its status (Pending, Approved, Rejected) updates on the same page — you'll also get a notification when it's actioned.",
        ],
      },
    ],
  },
];
