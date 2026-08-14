import { CheckCircle2, Award, IndianRupee, CalendarClock } from "lucide-react";

export interface StudentQuickStatsProps {
  overallAtt: number;
  totalPresent: number;
  totalDays: number;
  attColorText: string;
  avgScore: number | null;
  examCount: number;
  totalFees: number;
  paidFees: number;
  joinedDate: string;
  rollNo: string;
}

function attendanceMeter(pct: number) {
  if (pct >= 90) return "bg-emerald-500";
  if (pct >= 80) return "bg-amber-500";
  return "bg-red-500";
}

export function StudentQuickStats({
  overallAtt, totalPresent, totalDays, attColorText,
  avgScore, examCount,
  totalFees, paidFees,
  joinedDate, rollNo,
}: StudentQuickStatsProps) {
  const feePct = totalFees ? Math.round((paidFees / totalFees) * 100) : 0;

  const stats: {
    label: string;
    value: string;
    sub: string;
    icon: typeof CheckCircle2;
    iconClass: string;
    meterPct: number | null;
    meterClass: string;
  }[] = [
    {
      label: "Overall attendance",
      value: `${overallAtt}%`,
      sub: totalDays ? `${totalPresent}/${totalDays} days recorded` : "From enrolment record",
      icon: CheckCircle2,
      iconClass: `${attColorText} bg-emerald-500/10`,
      meterPct: overallAtt,
      meterClass: attendanceMeter(overallAtt),
    },
    {
      label: "Average score",
      value: avgScore !== null ? `${avgScore}%` : "—",
      sub: examCount ? `${examCount} result${examCount === 1 ? "" : "s"}` : "No exams recorded yet",
      icon: Award,
      iconClass: "text-blue-600 dark:text-blue-400 bg-blue-500/10",
      meterPct: avgScore,
      meterClass: "bg-blue-500",
    },
    {
      label: "Fee paid",
      value: totalFees ? `₹${paidFees.toLocaleString("en-IN")}` : "—",
      sub: totalFees ? `of ₹${totalFees.toLocaleString("en-IN")} total` : "No fee records yet",
      icon: IndianRupee,
      iconClass: "text-indigo-600 dark:text-indigo-400 bg-indigo-500/10",
      meterPct: totalFees ? feePct : null,
      meterClass: "bg-indigo-500",
    },
    {
      label: "Enrolled since",
      value: joinedDate,
      sub: `Roll No. ${rollNo}`,
      icon: CalendarClock,
      iconClass: "text-violet-600 dark:text-violet-400 bg-violet-500/10",
      meterPct: null,
      meterClass: "",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 rounded-xl border border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-800/50 overflow-hidden">
      {stats.map((st, i) => {
        const isLastCol = i % 2 === 1;
        const isLastRow = i >= 2;
        return (
          <div
            key={st.label}
            className={`p-5 space-y-3 ${!isLastCol ? "border-r border-gray-100 dark:border-zinc-700/50" : ""} ${!isLastRow ? "border-b border-gray-100 dark:border-zinc-700/50" : ""}`}
          >
            <div className="flex items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${st.iconClass}`}>
                <st.icon className="h-3.5 w-3.5" />
              </div>
              <p className="text-xs font-medium text-gray-500 dark:text-zinc-400">{st.label}</p>
            </div>
            <p className="text-2xl font-semibold text-gray-900 dark:text-zinc-50 leading-none">{st.value}</p>
            {st.meterPct !== null && (
              <div className="h-1.5 rounded-full bg-gray-100 dark:bg-zinc-700">
                <div className={`h-1.5 rounded-full ${st.meterClass}`} style={{ width: `${Math.min(100, Math.max(0, st.meterPct))}%` }} />
              </div>
            )}
            <p className="text-xs text-gray-400 dark:text-zinc-500">{st.sub}</p>
          </div>
        );
      })}
    </div>
  );
}
