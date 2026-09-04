import type { DocArticle } from "@/lib/docs/types";

export const STAFF_ARTICLES: DocArticle[] = [
  {
    slug: "getting-started",
    title: "Understanding your role as staff",
    summary: "Log in for the first time and find out what your specific job gives you access to.",
    steps: [
      {
        heading: "Log in",
        body: [
          "Your school admin creates your account and shares your login details — sign in and set a new password on first login.",
        ],
      },
      {
        heading: "Know your permission template",
        body: [
          "Support staff accounts are assigned a permission template by the school — Accountant, Librarian, Warden, HR Manager, Receptionist, or Lab Assistant — and your sidebar only shows the tools for that job.",
          "Every template also includes Announcements, Documents, Messages, and Leaves.",
        ],
      },
    ],
    tips: [
      "If your sidebar doesn't match a guide you're reading, you're likely on a different template — jump to the article that matches your actual job below.",
    ],
  },
  {
    slug: "accountant",
    title: "Accountant: fees, expenses & payroll",
    summary: "Collect fees, log expenses, and run payroll.",
    steps: [
      {
        heading: "Fee Management",
        body: [
          "Go to Fee Management to see what each student owes, record payments, and follow up on overdue fees.",
        ],
      },
      {
        heading: "Expenses",
        body: [
          "Go to Expenses → New Expense to log school spending by category, attaching a receipt where you have one.",
        ],
      },
      {
        heading: "Payroll",
        body: [
          "Go to Payroll to review staff salary structures and run monthly payroll, generating payslips.",
        ],
      },
    ],
  },
  {
    slug: "librarian",
    title: "Librarian: managing the library",
    summary: "Catalog books and track issues and returns.",
    steps: [
      {
        heading: "Manage the catalog",
        body: [
          "Go to Library → Add Book to add a new title to the catalog, with copies/quantity on hand.",
        ],
      },
      {
        heading: "Issue and return books",
        body: [
          "Search for a student or staff member and issue a book to them from the Library page.",
          "Mark a book Returned when it comes back — overdue books are flagged automatically.",
        ],
      },
    ],
  },
  {
    slug: "warden",
    title: "Warden: managing the hostel",
    summary: "Set up rooms and allocate resident students.",
    steps: [
      {
        heading: "Set up rooms",
        body: [
          "Go to Hostel to define blocks, rooms, and bed capacity.",
        ],
      },
      {
        heading: "Allocate students",
        body: [
          "Assign a boarding student to an available bed, and update their allocation if they change rooms.",
        ],
      },
    ],
  },
  {
    slug: "hr",
    title: "HR Manager: staff directory & leave approvals",
    summary: "Keep staff records up to date and process leave requests.",
    steps: [
      {
        heading: "Staff Directory",
        body: [
          "Go to Staff Directory to view and update staff records — contact details, role, and employment information.",
        ],
      },
      {
        heading: "Leave Approvals",
        body: [
          "Go to Leave Approvals to review pending staff leave requests and Approve or Reject each one — the staff member is notified either way.",
        ],
      },
      {
        heading: "Payroll",
        body: [
          "Go to Payroll to review salary structures and run monthly payroll for staff.",
        ],
      },
    ],
  },
  {
    slug: "front-desk",
    title: "Receptionist: admissions & front desk",
    summary: "Move applications forward and log front-desk visitors.",
    steps: [
      {
        heading: "Admissions",
        body: [
          "Go to Admissions to see incoming applications and move each one through your school's stages — inquiry, application, offer, enrolled.",
        ],
      },
      {
        heading: "Front Desk",
        body: [
          "Go to Front Desk to log visitors and walk-in enquiries — name, purpose, and who they're here to see.",
        ],
      },
    ],
  },
  {
    slug: "lab-inventory",
    title: "Lab Assistant: managing inventory",
    summary: "Track lab equipment and consumable stock.",
    steps: [
      {
        heading: "Track inventory",
        body: [
          "Go to Inventory to log equipment and stock items, with quantity on hand.",
        ],
      },
      {
        heading: "Log items in and out",
        body: [
          "Update an item's quantity when stock comes in or gets used, so levels stay accurate.",
        ],
      },
    ],
  },
  {
    slug: "communication",
    title: "Announcements, documents & messages",
    summary: "Stay informed and in touch — available on every staff template.",
    steps: [
      {
        heading: "Announcements",
        body: [
          "Go to Announcements to see notices posted by your school admin.",
        ],
      },
      {
        heading: "Documents",
        body: [
          "Go to Documents to browse and download circulars and files your school has shared with staff.",
        ],
      },
      {
        heading: "Messages",
        body: [
          "Go to Messages to send or receive direct messages with school admin or other staff.",
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
          "Your request goes to your school admin (or HR Manager, where your school has one). Its status updates on the same page, and you'll get a notification when it's actioned.",
        ],
      },
    ],
  },
];
