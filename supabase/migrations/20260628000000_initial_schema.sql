-- ============================================================
-- Shikshaloy — Initial Database Schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";

-- ── Enums ────────────────────────────────────────────────────

create type user_role as enum (
  'kernel', 'super_admin', 'admin', 'staff', 'teacher', 'parent', 'student', 'driver'
);

create type record_status as enum ('active', 'inactive');
create type account_status as enum ('pending', 'active', 'rejected');

create type staff_member_type   as enum ('teaching', 'non_teaching');
create type staff_member_status as enum ('active', 'on_leave', 'inactive');
create type gender_type         as enum ('Male', 'Female', 'Other');

create type attendance_status       as enum ('present', 'absent', 'late');
create type staff_attendance_status as enum ('present', 'absent', 'late', 'on_leave');

create type exam_type   as enum ('unit_test', 'mid_term', 'final');
create type exam_status as enum ('upcoming', 'ongoing', 'completed', 'published');

create type fee_status   as enum ('paid', 'partial', 'overdue');
create type payment_mode as enum ('online', 'cash', 'cheque', 'upi');

create type payroll_status as enum ('processed', 'pending', 'on_hold');
create type pay_mode       as enum ('bank_transfer', 'cheque');

create type expense_status as enum ('approved', 'pending', 'rejected');

create type admission_status as enum (
  'pending', 'under_review', 'approved', 'waitlisted', 'rejected', 'enrolled'
);

create type announcement_priority as enum ('urgent', 'normal', 'info');
create type announcement_status   as enum ('active', 'draft', 'archived');
create type announcement_audience as enum ('all', 'students', 'staff', 'parents', 'class');

create type event_type    as enum ('holiday', 'exam', 'meeting', 'sports', 'cultural', 'workshop', 'other');
create type audience_type as enum ('all', 'students', 'parents', 'staff', 'teachers');
create type calendar_event_type as enum ('holiday', 'exam', 'event', 'ptm', 'term', 'vacation');

create type vehicle_status       as enum ('active', 'maintenance', 'inactive');
create type fuel_type            as enum ('diesel', 'cng', 'electric');
create type route_status         as enum ('active', 'inactive');
create type transport_fee_status as enum ('paid', 'partial', 'overdue');

create type room_type        as enum ('single', 'double', 'triple', 'dormitory');
create type room_status      as enum ('available', 'occupied', 'maintenance');
create type hostel_fee_status as enum ('paid', 'partial', 'overdue');

create type item_condition as enum ('good', 'fair', 'poor');

create type leave_type   as enum ('sick', 'casual', 'earned', 'maternity', 'emergency');
create type leave_status as enum ('pending', 'approved', 'rejected', 'cancelled');

create type cert_type   as enum ('bonafide', 'transfer', 'character', 'study');
create type cert_status as enum ('pending', 'ready', 'issued', 'rejected');

create type subject_type   as enum ('core', 'elective');
create type subject_status as enum ('active', 'inactive');

-- ============================================================
-- CORE
-- ============================================================

-- profiles — one row per auth.users account
create table profiles (
  id          uuid primary key references auth.users on delete cascade,
  role        user_role      not null,
  full_name   text,
  phone       text,
  avatar_url  text,
  status      account_status default 'active',
  school_id   uuid,                          -- null for kernel
  created_at  timestamptz    default now(),
  updated_at  timestamptz    default now()
);

-- schools — one per super_admin / institution
create table schools (
  id               uuid primary key default gen_random_uuid(),
  name             text           not null,
  institution_type text,
  city             text,
  state            text,
  country          text           default 'India',
  phone            text,
  website          text,
  address          text,
  logo_url         text,
  status           account_status default 'pending',
  owner_id         uuid           references profiles(id) on delete set null,
  created_at       timestamptz    default now(),
  updated_at       timestamptz    default now()
);

-- add school FK to profiles now that schools table exists
alter table profiles
  add constraint profiles_school_id_fkey
  foreign key (school_id) references schools(id) on delete set null;

-- academic_years — "2026-27" etc.
create table academic_years (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id) on delete cascade,
  name        text        not null,  -- "2026-27"
  start_date  date        not null,
  end_date    date        not null,
  is_current  boolean     default false,
  created_at  timestamptz default now(),
  unique (school_id, name)
);

-- ============================================================
-- ACADEMIC STRUCTURE
-- ============================================================

-- grades — Class 5, 6, 7...
create table grades (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id) on delete cascade,
  name        text        not null,   -- "Class 5"
  level       integer     not null,   -- 5, 6, 7...
  created_at  timestamptz default now(),
  unique (school_id, level)
);

-- sections — 5-A, 5-B...
create table sections (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid          not null references schools(id) on delete cascade,
  grade_id         uuid          not null references grades(id) on delete cascade,
  academic_year_id uuid          not null references academic_years(id) on delete cascade,
  name             text          not null,   -- "A", "B"
  room             text,
  capacity         integer       default 40,
  class_teacher_id uuid          references profiles(id) on delete set null,
  avg_attendance   numeric(5,2)  default 0,
  status           record_status default 'active',
  created_at       timestamptz   default now(),
  unique (school_id, grade_id, name, academic_year_id)
);

-- subjects
create table subjects (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid           not null references schools(id) on delete cascade,
  name           text           not null,
  code           text           not null,
  type           subject_type   default 'core',
  status         subject_status default 'active',
  weekly_periods integer        default 5,
  created_at     timestamptz    default now(),
  unique (school_id, code)
);

-- section_subjects — which subject in which section, taught by whom
create table section_subjects (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid        not null references schools(id) on delete cascade,
  section_id       uuid        not null references sections(id) on delete cascade,
  subject_id       uuid        not null references subjects(id) on delete cascade,
  teacher_id       uuid        references profiles(id) on delete set null,
  academic_year_id uuid        not null references academic_years(id) on delete cascade,
  weekly_periods   integer,
  created_at       timestamptz default now(),
  unique (section_id, subject_id, academic_year_id)
);

-- timetable_periods — school time-slot definitions (period 1: 08:00-08:45, ...)
create table timetable_periods (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id) on delete cascade,
  number      integer     not null,
  start_time  time        not null,
  end_time    time        not null,
  is_break    boolean     default false,
  break_label text,
  created_at  timestamptz default now(),
  unique (school_id, number)
);

-- timetable_slots — actual weekly schedule
create table timetable_slots (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid        not null references schools(id) on delete cascade,
  section_id       uuid        not null references sections(id) on delete cascade,
  subject_id       uuid        references subjects(id) on delete set null,
  teacher_id       uuid        references profiles(id) on delete set null,
  academic_year_id uuid        not null references academic_years(id) on delete cascade,
  day_of_week      smallint    not null,  -- 0=Mon … 5=Sat
  period_number    integer     not null,
  room             text,
  created_at       timestamptz default now(),
  unique (section_id, day_of_week, period_number, academic_year_id)
);

-- ============================================================
-- PEOPLE
-- ============================================================

-- students
create table students (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid          not null references schools(id) on delete cascade,
  profile_id       uuid          references profiles(id) on delete set null,
  roll_no          text,
  section_id       uuid          references sections(id) on delete set null,
  academic_year_id uuid          references academic_years(id) on delete set null,
  full_name        text          not null,
  dob              date,
  gender           gender_type,
  address          text,
  phone            text,
  attendance_pct   numeric(5,2)  default 0,
  fee_status       fee_status    default 'overdue',
  status           record_status default 'active',
  joined_date      date,
  created_at       timestamptz   default now(),
  updated_at       timestamptz   default now()
);

-- parents
create table parents (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid          not null references schools(id) on delete cascade,
  profile_id  uuid          references profiles(id) on delete set null,
  full_name   text          not null,
  phone       text,
  email       text,
  occupation  text,
  address     text,
  status      record_status default 'active',
  joined_date date,
  created_at  timestamptz   default now(),
  updated_at  timestamptz   default now()
);

-- student_parents — junction (one student can have multiple parents)
create table student_parents (
  student_id    uuid not null references students(id) on delete cascade,
  parent_id     uuid not null references parents(id) on delete cascade,
  relationship  text default 'parent',   -- 'father','mother','guardian'
  is_primary    boolean default false,
  primary key (student_id, parent_id)
);

-- staff_members
create table staff_members (
  id                       uuid primary key default gen_random_uuid(),
  school_id                uuid                not null references schools(id) on delete cascade,
  profile_id               uuid                references profiles(id) on delete set null,
  employee_id              text,
  full_name                text                not null,
  phone                    text,
  email                    text,
  type                     staff_member_type   default 'teaching',
  designation              text,
  department               text,
  joined_date              date,
  status                   staff_member_status default 'active',
  permission_template_id   text,
  permission_template_name text,
  created_at               timestamptz         default now(),
  updated_at               timestamptz         default now(),
  unique (school_id, employee_id)
);

-- staff_subjects — which subjects a teacher teaches (and whether they're class teacher)
create table staff_subjects (
  staff_id         uuid not null references staff_members(id) on delete cascade,
  subject_id       uuid not null references subjects(id) on delete cascade,
  class_teacher_of uuid references sections(id) on delete set null,
  primary key (staff_id, subject_id)
);

-- ============================================================
-- ATTENDANCE
-- ============================================================

create table student_attendance (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid              not null references schools(id) on delete cascade,
  student_id  uuid              not null references students(id) on delete cascade,
  section_id  uuid              not null references sections(id) on delete cascade,
  date        date              not null,
  status      attendance_status not null default 'present',
  marked_by   uuid              references profiles(id) on delete set null,
  remarks     text,
  created_at  timestamptz       default now(),
  unique (student_id, date)
);

create table staff_attendance (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid                     not null references schools(id) on delete cascade,
  staff_id    uuid                     not null references staff_members(id) on delete cascade,
  date        date                     not null,
  status      staff_attendance_status  not null default 'present',
  marked_by   uuid                     references profiles(id) on delete set null,
  remarks     text,
  created_at  timestamptz              default now(),
  unique (staff_id, date)
);

-- ============================================================
-- EXAMS & RESULTS
-- ============================================================

create table exams (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid          not null references schools(id) on delete cascade,
  academic_year_id uuid          not null references academic_years(id) on delete cascade,
  name             text          not null,
  type             exam_type     not null,
  status           exam_status   default 'upcoming',
  start_date       date          not null,
  end_date         date          not null,
  created_at       timestamptz   default now()
);

create table exam_results (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid          not null references schools(id) on delete cascade,
  exam_id        uuid          not null references exams(id) on delete cascade,
  student_id     uuid          not null references students(id) on delete cascade,
  subject_id     uuid          not null references subjects(id) on delete cascade,
  marks_obtained numeric(5,2),
  max_marks      numeric(5,2)  default 100,
  grade          text,
  rank           integer,
  is_absent      boolean       default false,
  created_at     timestamptz   default now(),
  unique (exam_id, student_id, subject_id)
);

-- ============================================================
-- FEES
-- ============================================================

-- fee_structures — what is charged per grade per category
create table fee_structures (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid          not null references schools(id) on delete cascade,
  academic_year_id uuid          not null references academic_years(id) on delete cascade,
  grade_id         uuid          references grades(id) on delete cascade,  -- null = all grades
  category         text          not null,   -- "Tuition Fee", "Library Fee", ...
  amount           numeric(10,2) not null,
  frequency        text          default 'monthly',  -- monthly, annual, quarterly
  is_optional      boolean       default false,
  created_at       timestamptz   default now()
);

-- fee_payments — per student per month per category
create table fee_payments (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid          not null references schools(id) on delete cascade,
  student_id       uuid          not null references students(id) on delete cascade,
  academic_year_id uuid          not null references academic_years(id) on delete cascade,
  month_str        text          not null,   -- "2026-06"
  category         text          not null,
  amount_due       numeric(10,2) not null,
  amount_paid      numeric(10,2) default 0,
  status           fee_status    default 'overdue',
  paid_date        date,
  receipt_no       text,
  payment_mode     payment_mode,
  created_at       timestamptz   default now(),
  updated_at       timestamptz   default now()
);

-- ============================================================
-- PAYROLL
-- ============================================================

create table payroll_records (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid           not null references schools(id) on delete cascade,
  staff_id         uuid           not null references staff_members(id) on delete cascade,
  month_str        text           not null,   -- "2026-06"
  gross            numeric(10,2)  not null,
  basic            numeric(10,2),
  hra              numeric(10,2),
  da               numeric(10,2),
  ta               numeric(10,2),
  other_allowances numeric(10,2),
  pf_deduction     numeric(10,2)  default 0,
  tds_deduction    numeric(10,2)  default 0,
  prof_tax         numeric(10,2)  default 0,
  net              numeric(10,2)  not null,
  status           payroll_status default 'pending',
  slip_no          text,
  paid_on          date,
  pay_mode         pay_mode,
  created_at       timestamptz    default now(),
  updated_at       timestamptz    default now(),
  unique (staff_id, month_str)
);

-- ============================================================
-- EXPENSES
-- ============================================================

create table expense_budgets (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid          not null references schools(id) on delete cascade,
  academic_year_id uuid          not null references academic_years(id) on delete cascade,
  category         text          not null,
  monthly_amount   numeric(10,2) not null,
  created_at       timestamptz   default now(),
  unique (school_id, academic_year_id, category)
);

create table expenses (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid           not null references schools(id) on delete cascade,
  date        date           not null,
  month_str   text           not null,
  category    text           not null,
  description text,
  vendor      text,
  amount      numeric(10,2)  not null,
  status      expense_status default 'pending',
  receipt_ref text,
  approved_by uuid           references staff_members(id) on delete set null,
  created_at  timestamptz    default now(),
  updated_at  timestamptz    default now()
);

-- ============================================================
-- ADMISSIONS
-- ============================================================

create table admission_applications (
  id                 uuid primary key default gen_random_uuid(),
  school_id          uuid             not null references schools(id) on delete cascade,
  academic_year_id   uuid             not null references academic_years(id) on delete cascade,
  application_no     text             not null,
  applicant_name     text             not null,
  dob                date,
  gender             gender_type,
  applying_for_grade text,            -- "5", "6", ...
  parent_name        text,
  parent_phone       text,
  parent_email       text,
  previous_school    text,
  submitted_date     date,
  status             admission_status default 'pending',
  notes              text,
  reviewed_by        uuid             references staff_members(id) on delete set null,
  created_at         timestamptz      default now(),
  updated_at         timestamptz      default now(),
  unique (school_id, application_no)
);

-- ============================================================
-- COMMUNICATIONS
-- ============================================================

create table announcements (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid                   not null references schools(id) on delete cascade,
  title             text                   not null,
  content           text                   not null,
  priority          announcement_priority  default 'normal',
  status            announcement_status    default 'draft',
  audience          announcement_audience  default 'all',
  audience_label    text,
  target_section_id uuid                   references sections(id) on delete set null,
  expires_at        date,
  posted_by         uuid                   references profiles(id) on delete set null,
  views             integer                default 0,
  created_at        timestamptz            default now(),
  updated_at        timestamptz            default now()
);

create table school_events (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid          not null references schools(id) on delete cascade,
  academic_year_id uuid          references academic_years(id) on delete set null,
  title            text          not null,
  type             event_type    not null,
  date             date          not null,
  end_date         date,
  time             time,
  end_time         time,
  location         text,
  description      text,
  is_all_day       boolean       default true,
  created_at       timestamptz   default now()
);

-- event_audiences junction
create table event_audiences (
  event_id      uuid          not null references school_events(id) on delete cascade,
  audience_type audience_type not null,
  primary key (event_id, audience_type)
);

-- academic_calendar — the academic calendar view
create table academic_calendar (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid                not null references schools(id) on delete cascade,
  academic_year_id uuid                references academic_years(id) on delete set null,
  title            text                not null,
  date             date                not null,
  date_to          date,
  type             calendar_event_type not null,
  description      text,
  affects_all      boolean             default true,
  classes          text,               -- "Grade 10, 12"
  created_at       timestamptz         default now()
);

-- conversations — messaging between two users
create table conversations (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid        not null references schools(id) on delete cascade,
  participant1 uuid        not null references profiles(id) on delete cascade,
  participant2 uuid        not null references profiles(id) on delete cascade,
  last_message text,
  last_time    timestamptz,
  created_at   timestamptz default now(),
  unique (participant1, participant2)
);

-- messages — individual message entries inside a conversation
create table messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid        not null references conversations(id) on delete cascade,
  sender_id       uuid        not null references profiles(id) on delete cascade,
  text            text        not null,
  is_read         boolean     default false,
  sent_at         timestamptz default now()
);

-- ============================================================
-- LIBRARY
-- ============================================================

create table library_books (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid        not null references schools(id) on delete cascade,
  title        text        not null,
  author       text,
  isbn         text,
  category     text,
  total_copies integer     default 1,
  added_year   integer,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- book_issues — track who has which book
create table book_issues (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid        not null references schools(id) on delete cascade,
  book_id       uuid        not null references library_books(id) on delete cascade,
  borrower_id   uuid        not null references profiles(id) on delete cascade,
  borrower_type text        not null,   -- 'student', 'staff'
  issued_date   date        not null,
  due_date      date        not null,
  returned_date date,
  created_at    timestamptz default now()
);

-- ============================================================
-- TRANSPORT
-- ============================================================

create table vehicles (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid           not null references schools(id) on delete cascade,
  reg_no       text           not null,
  model        text,
  capacity     integer,
  year         integer,
  status       vehicle_status default 'active',
  driver_id    uuid           references profiles(id) on delete set null,
  fuel_type    fuel_type      default 'diesel',
  last_service date,
  next_service date,
  created_at   timestamptz    default now(),
  unique (school_id, reg_no)
);

create table transport_routes (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid          not null references schools(id) on delete cascade,
  route_no          text          not null,
  route_name        text,
  vehicle_id        uuid          references vehicles(id) on delete set null,
  driver_id         uuid          references profiles(id) on delete set null,
  driver_phone      text,
  stops             jsonb         default '[]',  -- ["Shyambazar","Belgachia",...]
  capacity          integer,
  status            route_status  default 'active',
  morning_departure time,
  evening_departure time,
  created_at        timestamptz   default now(),
  unique (school_id, route_no)
);

create table student_transport (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid                 not null references schools(id) on delete cascade,
  student_id       uuid                 not null references students(id) on delete cascade,
  route_id         uuid                 not null references transport_routes(id) on delete cascade,
  academic_year_id uuid                 not null references academic_years(id) on delete cascade,
  stop_name        text,
  monthly_fee      numeric(10,2)        default 0,
  fee_status       transport_fee_status default 'overdue',
  created_at       timestamptz          default now(),
  unique (student_id, academic_year_id)
);

-- ============================================================
-- HOSTEL
-- ============================================================

create table hostel_rooms (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid        not null references schools(id) on delete cascade,
  room_no     text        not null,
  block       text,
  floor       integer,
  type        room_type   not null,
  capacity    integer     not null,
  warden_id   uuid        references profiles(id) on delete set null,
  amenities   jsonb       default '[]',  -- ["AC","Attached Bath",...]
  status      room_status default 'available',
  created_at  timestamptz default now(),
  unique (school_id, room_no)
);

create table hostel_allotments (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid              not null references schools(id) on delete cascade,
  student_id  uuid              not null references students(id) on delete cascade,
  room_id     uuid              not null references hostel_rooms(id) on delete cascade,
  join_date   date,
  leave_date  date,
  monthly_fee numeric(10,2)     default 0,
  fee_status  hostel_fee_status default 'overdue',
  is_active   boolean           default true,
  created_at  timestamptz       default now()
);

-- ============================================================
-- INVENTORY
-- ============================================================

create table inventory_items (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid           not null references schools(id) on delete cascade,
  name         text           not null,
  category     text,
  location     text,
  total_qty    integer        default 0,
  in_use_qty   integer        default 0,
  damaged_qty  integer        default 0,
  condition    item_condition default 'good',
  unit_cost    numeric(10,2),
  last_updated date,
  notes        text,
  created_at   timestamptz    default now(),
  updated_at   timestamptz    default now()
);

-- ============================================================
-- LEAVE MANAGEMENT
-- ============================================================

create table leave_requests (
  id          uuid primary key default gen_random_uuid(),
  school_id   uuid         not null references schools(id) on delete cascade,
  staff_id    uuid         not null references staff_members(id) on delete cascade,
  leave_type  leave_type   not null,
  from_date   date         not null,
  to_date     date         not null,
  days        integer      not null,
  reason      text,
  status      leave_status default 'pending',
  applied_on  date         default current_date,
  approved_by uuid         references staff_members(id) on delete set null,
  created_at  timestamptz  default now(),
  updated_at  timestamptz  default now()
);

-- ============================================================
-- CERTIFICATES
-- ============================================================

create table certificate_requests (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid        not null references schools(id) on delete cascade,
  student_id   uuid        not null references students(id) on delete cascade,
  cert_type    cert_type   not null,
  purpose      text,
  requested_on date        default current_date,
  issued_on    date,
  status       cert_status default 'pending',
  issued_by    uuid        references staff_members(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index on profiles (school_id);
create index on academic_years (school_id, is_current);
create index on sections (school_id, grade_id, academic_year_id);
create index on students (school_id, section_id);
create index on students (school_id, status);
create index on parents (school_id);
create index on staff_members (school_id, status);
create index on staff_members (school_id, type);
create index on student_attendance (school_id, date);
create index on student_attendance (student_id, date);
create index on staff_attendance (school_id, date);
create index on staff_attendance (staff_id, date);
create index on exams (school_id, academic_year_id);
create index on exam_results (exam_id, student_id);
create index on fee_payments (school_id, month_str);
create index on fee_payments (student_id, month_str);
create index on fee_payments (school_id, status);
create index on payroll_records (school_id, month_str);
create index on payroll_records (school_id, status);
create index on expenses (school_id, month_str);
create index on expenses (school_id, status);
create index on admission_applications (school_id, academic_year_id, status);
create index on announcements (school_id, status);
create index on school_events (school_id, date);
create index on academic_calendar (school_id, date);
create index on messages (conversation_id, sent_at);
create index on library_books (school_id);
create index on book_issues (book_id, returned_date);
create index on book_issues (borrower_id);
create index on transport_routes (school_id, status);
create index on student_transport (school_id, academic_year_id);
create index on hostel_allotments (school_id, is_active);
create index on leave_requests (school_id, status);
create index on leave_requests (staff_id);
create index on certificate_requests (school_id, status);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table profiles               enable row level security;
alter table schools                enable row level security;
alter table academic_years         enable row level security;
alter table grades                 enable row level security;
alter table sections               enable row level security;
alter table subjects               enable row level security;
alter table section_subjects       enable row level security;
alter table timetable_periods      enable row level security;
alter table timetable_slots        enable row level security;
alter table students               enable row level security;
alter table parents                enable row level security;
alter table student_parents        enable row level security;
alter table staff_members          enable row level security;
alter table staff_subjects         enable row level security;
alter table student_attendance     enable row level security;
alter table staff_attendance       enable row level security;
alter table exams                  enable row level security;
alter table exam_results           enable row level security;
alter table fee_structures         enable row level security;
alter table fee_payments           enable row level security;
alter table payroll_records        enable row level security;
alter table expense_budgets        enable row level security;
alter table expenses               enable row level security;
alter table admission_applications enable row level security;
alter table announcements          enable row level security;
alter table school_events          enable row level security;
alter table event_audiences        enable row level security;
alter table academic_calendar      enable row level security;
alter table conversations          enable row level security;
alter table messages               enable row level security;
alter table library_books          enable row level security;
alter table book_issues            enable row level security;
alter table vehicles               enable row level security;
alter table transport_routes       enable row level security;
alter table student_transport      enable row level security;
alter table hostel_rooms           enable row level security;
alter table hostel_allotments      enable row level security;
alter table inventory_items        enable row level security;
alter table leave_requests         enable row level security;
alter table certificate_requests   enable row level security;

-- ── Helper functions ──────────────────────────────────────────

create or replace function auth_role()
  returns user_role language sql security definer stable as $$
  select role from profiles where id = auth.uid();
$$;

create or replace function auth_school_id()
  returns uuid language sql security definer stable as $$
  select school_id from profiles where id = auth.uid();
$$;

-- ── RLS Policies ──────────────────────────────────────────────

-- profiles
create policy "profiles: read own or kernel"
  on profiles for select
  using (id = auth.uid() or auth_role() = 'kernel');

create policy "profiles: update own"
  on profiles for update
  using (id = auth.uid());

-- schools
create policy "schools: kernel full access"
  on schools for all
  using (auth_role() = 'kernel');

create policy "schools: owner and members can read"
  on schools for select
  using (owner_id = auth.uid() or id = auth_school_id());

-- generic school-scoped read for authenticated users in the same school
create policy "academic_years: school access"
  on academic_years for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "grades: school access"
  on grades for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "sections: school access"
  on sections for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "subjects: school access"
  on subjects for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "section_subjects: school access"
  on section_subjects for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "timetable_periods: school access"
  on timetable_periods for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "timetable_slots: school access"
  on timetable_slots for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "students: school access"
  on students for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "parents: school access"
  on parents for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "student_parents: school access"
  on student_parents for all
  using (
    exists (
      select 1 from students s
      where s.id = student_parents.student_id
        and (s.school_id = auth_school_id() or auth_role() = 'kernel')
    )
  );

create policy "staff_members: school access"
  on staff_members for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "staff_subjects: school access"
  on staff_subjects for all
  using (
    exists (
      select 1 from staff_members sm
      where sm.id = staff_subjects.staff_id
        and (sm.school_id = auth_school_id() or auth_role() = 'kernel')
    )
  );

create policy "student_attendance: school access"
  on student_attendance for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "staff_attendance: school access"
  on staff_attendance for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "exams: school access"
  on exams for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "exam_results: school access"
  on exam_results for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "fee_structures: school access"
  on fee_structures for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "fee_payments: school access"
  on fee_payments for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "payroll_records: school access"
  on payroll_records for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "expense_budgets: school access"
  on expense_budgets for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "expenses: school access"
  on expenses for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "admission_applications: school access"
  on admission_applications for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "announcements: school access"
  on announcements for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "school_events: school access"
  on school_events for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "event_audiences: school access"
  on event_audiences for all
  using (
    exists (
      select 1 from school_events e
      where e.id = event_audiences.event_id
        and (e.school_id = auth_school_id() or auth_role() = 'kernel')
    )
  );

create policy "academic_calendar: school access"
  on academic_calendar for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "conversations: participant access"
  on conversations for all
  using (
    participant1 = auth.uid() or participant2 = auth.uid() or auth_role() = 'kernel'
  );

create policy "messages: participant access"
  on messages for all
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
        and (c.participant1 = auth.uid() or c.participant2 = auth.uid())
    ) or auth_role() = 'kernel'
  );

create policy "library_books: school access"
  on library_books for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "book_issues: school access"
  on book_issues for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "vehicles: school access"
  on vehicles for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "transport_routes: school access"
  on transport_routes for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "student_transport: school access"
  on student_transport for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "hostel_rooms: school access"
  on hostel_rooms for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "hostel_allotments: school access"
  on hostel_allotments for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "inventory_items: school access"
  on inventory_items for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "leave_requests: school access"
  on leave_requests for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

create policy "certificate_requests: school access"
  on certificate_requests for all
  using (school_id = auth_school_id() or auth_role() = 'kernel');

-- ============================================================
-- TRIGGER — auto-create profile on new auth user
-- ============================================================

create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, role, full_name, status, school_id)
  values (
    new.id,
    (new.raw_user_meta_data->>'role')::user_role,
    new.raw_user_meta_data->>'full_name',
    coalesce((new.raw_user_meta_data->>'status'), 'active')::account_status,
    nullif(new.raw_user_meta_data->>'school_id', '')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
