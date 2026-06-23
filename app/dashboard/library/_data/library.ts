export type BookStatus = "available" | "low" | "out";
export type Category =
  | "Science"
  | "Mathematics"
  | "Literature"
  | "History"
  | "Geography"
  | "Reference"
  | "Fiction"
  | "Non-Fiction";

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  category: Category;
  totalCopies: number;
  issued: number;
  overdue: number;
  addedYear: number;
}

export const ALL_BOOKS: Book[] = [
  { id:  1, title: "Mathematics for Class 10",         author: "R.D. Sharma",          isbn: "978-8193869154", category: "Mathematics", totalCopies: 12, issued:  8, overdue: 1, addedYear: 2021 },
  { id:  2, title: "Science Textbook Grade 9",         author: "NCERT",                isbn: "978-8174505101", category: "Science",     totalCopies: 15, issued: 10, overdue: 2, addedYear: 2020 },
  { id:  3, title: "India: A History",                 author: "John Keay",            isbn: "978-0006387923", category: "History",     totalCopies:  6, issued:  6, overdue: 0, addedYear: 2019 },
  { id:  4, title: "Wings of Fire",                    author: "A.P.J. Abdul Kalam",   isbn: "978-8173711466", category: "Non-Fiction", totalCopies: 10, issued:  7, overdue: 3, addedYear: 2022 },
  { id:  5, title: "The Discovery of India",           author: "Jawaharlal Nehru",     isbn: "978-0195623598", category: "History",     totalCopies:  5, issued:  2, overdue: 0, addedYear: 2018 },
  { id:  6, title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling",   isbn: "978-0439708180", category: "Fiction",     totalCopies:  8, issued:  8, overdue: 2, addedYear: 2021 },
  { id:  7, title: "English Grammar in Use",           author: "Raymond Murphy",       isbn: "978-1107539334", category: "Reference",   totalCopies: 20, issued:  5, overdue: 0, addedYear: 2020 },
  { id:  8, title: "Godan",                            author: "Munshi Premchand",     isbn: "978-8126706174", category: "Literature",  totalCopies:  7, issued:  4, overdue: 1, addedYear: 2019 },
  { id:  9, title: "Oxford Atlas of the World",        author: "Oxford Press",         isbn: "978-0198835998", category: "Geography",   totalCopies:  4, issued:  1, overdue: 0, addedYear: 2022 },
  { id: 10, title: "Physics Part I — Class 12",        author: "NCERT",                isbn: "978-8174505897", category: "Science",     totalCopies: 18, issued: 14, overdue: 3, addedYear: 2021 },
  { id: 11, title: "The Alchemist",                    author: "Paulo Coelho",         isbn: "978-0062315007", category: "Fiction",     totalCopies:  9, issued:  9, overdue: 2, addedYear: 2020 },
  { id: 12, title: "Maths Olympiad Workbook",          author: "MTG Editorial",        isbn: "978-9387563902", category: "Mathematics", totalCopies:  6, issued:  2, overdue: 0, addedYear: 2023 },
  { id: 13, title: "Geography of India",               author: "Majid Husain",         isbn: "978-9352534906", category: "Geography",   totalCopies:  8, issued:  5, overdue: 1, addedYear: 2021 },
  { id: 14, title: "Animal Farm",                      author: "George Orwell",        isbn: "978-0451526342", category: "Fiction",     totalCopies:  6, issued:  3, overdue: 0, addedYear: 2019 },
  { id: 15, title: "A Brief History of Time",          author: "Stephen Hawking",      isbn: "978-0553380163", category: "Science",     totalCopies:  5, issued:  5, overdue: 1, addedYear: 2020 },
  { id: 16, title: "Macbeth",                          author: "William Shakespeare",  isbn: "978-0743477109", category: "Literature",  totalCopies:  7, issued:  2, overdue: 0, addedYear: 2018 },
  { id: 17, title: "The World Factbook",               author: "CIA (Reference)",      isbn: "978-1598887266", category: "Reference",   totalCopies:  3, issued:  1, overdue: 0, addedYear: 2022 },
  { id: 18, title: "Chemistry Part II — Class 11",     author: "NCERT",                isbn: "978-8174505712", category: "Science",     totalCopies: 14, issued: 11, overdue: 2, addedYear: 2021 },
  { id: 19, title: "My Experiments with Truth",        author: "Mahatma Gandhi",       isbn: "978-0807059098", category: "Non-Fiction", totalCopies:  5, issued:  3, overdue: 1, addedYear: 2019 },
  { id: 20, title: "Coordinate Geometry",              author: "S.L. Loney",           isbn: "978-8121908177", category: "Mathematics", totalCopies:  8, issued:  6, overdue: 0, addedYear: 2020 },
  { id: 21, title: "To Kill a Mockingbird",            author: "Harper Lee",           isbn: "978-0061935466", category: "Fiction",     totalCopies:  7, issued:  4, overdue: 1, addedYear: 2021 },
  { id: 22, title: "Atlas of Human Anatomy",           author: "Frank H. Netter",      isbn: "978-0323393225", category: "Reference",   totalCopies:  2, issued:  2, overdue: 0, addedYear: 2022 },
];

export const CATEGORIES: Category[] = [
  "Science", "Mathematics", "Literature", "History",
  "Geography", "Reference", "Fiction", "Non-Fiction",
];

export function bookStatus(book: Book): BookStatus {
  const available = book.totalCopies - book.issued;
  if (available === 0) return "out";
  if (available <= 2)  return "low";
  return "available";
}

export function availableCopies(book: Book) {
  return book.totalCopies - book.issued;
}

export const AVATAR_COLORS = [
  "bg-blue-500",   "bg-violet-500", "bg-emerald-500", "bg-rose-500",
  "bg-amber-500",  "bg-teal-500",   "bg-indigo-500",  "bg-pink-500",
  "bg-cyan-500",   "bg-orange-500",
];

export function avatarColor(id: number) {
  return AVATAR_COLORS[id % AVATAR_COLORS.length];
}

export function initials(title: string) {
  return title.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}
