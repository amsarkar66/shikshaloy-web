import type { DocArticle } from "@/lib/docs/types";

export const STUDENT_ARTICLES: DocArticle[] = [
  {
    slug: "getting-started",
    title: "Getting started as a Student",
    summary: "Log in for the first time and find your way around.",
    steps: [
      {
        heading: "Log in",
        body: [
          "Your school creates your account and shares your login details — sign in and set a new password on first login.",
        ],
      },
      {
        heading: "Find your way around",
        body: [
          "The sidebar covers My Classes, Attendance, Grades, Homework, and Timetable.",
          "The Overview page shows a quick summary — today's timetable and any homework due soon.",
        ],
      },
    ],
  },
  {
    slug: "my-classes",
    title: "Viewing your classes",
    summary: "See the classes, subjects, and teachers you have this year.",
    steps: [
      {
        heading: "Open My Classes",
        body: [
          "Go to My Classes to see your class, section, and every subject you're enrolled in, along with the teacher for each.",
        ],
      },
    ],
  },
  {
    slug: "attendance",
    title: "Viewing your attendance",
    summary: "Check your attendance record for the term.",
    steps: [
      {
        heading: "Open Attendance",
        body: [
          "Go to Attendance to see a day-by-day record of your attendance, marked by your teachers.",
        ],
      },
      {
        heading: "Check your summary",
        body: [
          "A running total (present, absent, late) is shown at the top — useful for keeping an eye on your attendance percentage.",
        ],
      },
    ],
    tips: [
      "If you think a day was marked incorrectly, ask your class teacher to correct it — you can't edit attendance yourself.",
    ],
  },
  {
    slug: "grades",
    title: "Viewing grades and report cards",
    summary: "See your marks once a teacher has published them.",
    steps: [
      {
        heading: "Open Grades",
        body: [
          "Go to Grades to see marks for each exam and subject as your teachers publish them.",
        ],
      },
      {
        heading: "Download your report card",
        body: [
          "Once your school publishes a full exam's results, a report card becomes available here to view or download as a PDF.",
        ],
      },
    ],
  },
  {
    slug: "homework",
    title: "Viewing and submitting homework",
    summary: "See what's assigned and turn it in before the due date.",
    steps: [
      {
        heading: "Check what's assigned",
        body: [
          "Go to Homework to see every assignment for your classes, with due dates and instructions from your teacher.",
        ],
      },
      {
        heading: "Submit your work",
        body: [
          "Open an assignment and click Submit to upload a file or type your answer, then confirm — your teacher is notified.",
          "You can resubmit before the due date if you need to fix something.",
        ],
      },
    ],
    tips: [
      "Submissions made after the due date are marked Late — submit early if you can.",
    ],
  },
  {
    slug: "timetable",
    title: "Viewing your timetable",
    summary: "See your weekly class schedule.",
    steps: [
      {
        heading: "Open Timetable",
        body: [
          "Go to Timetable for a weekly grid of every period, subject, and teacher for your class.",
        ],
      },
    ],
  },
];
