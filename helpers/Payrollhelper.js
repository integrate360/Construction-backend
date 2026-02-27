import Attendance from "../models/Attendance.js";

const calcPayroll = (
  structure,
  presentDays,
  overtimeHours = 0,
  allowances = [],
  deductions = [],
) => {
  let basicSalary = 0;

  if (structure.salaryType === "daily") {
    basicSalary = structure.rateAmount * presentDays;
  } else if (structure.salaryType === "monthly") {
    basicSalary = structure.rateAmount;
  } else if (structure.salaryType === "hourly") {
    // ✅ Fixed: hourly = rateAmount * presentDays * 8 hours per day
    basicSalary = structure.rateAmount * presentDays * 8;
  }

  const overtimePay = (structure.overtimeRate || 0) * overtimeHours;
  const totalAllowances = allowances.reduce((sum, a) => sum + (a.amount || 0), 0);
  const totalDeductions = deductions.reduce((sum, d) => sum + (d.amount || 0), 0);

  const grossSalary = basicSalary + overtimePay + totalAllowances;

  // ✅ netSalary should never go below 0
  const netSalary = Math.max(0, grossSalary - totalDeductions);

  return {
    basicSalary,
    overtimePay,
    totalAllowances,
    totalDeductions,
    grossSalary,
    netSalary,
  };
};
const getAttendanceSummary = async (
  userId,
  projectId,
  periodStart,
  periodEnd,
) => {
  const record = await Attendance.findOne({ user: userId, project: projectId });
  if (!record)
    return {
      presentDays: 0,
      absentDays: 0,
      totalWorkingDays: 0,
      overtimeHours: 0,
    };

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  const checkedInDays = new Set();
  record.history.forEach((h) => {
    const d = new Date(h.createdAt);
    if (h.attendanceType === "check-in" && d >= start && d <= end) {
      checkedInDays.add(d.toDateString());
    }
  });

  const presentDays = checkedInDays.size;

  let totalWorkingDays = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) totalWorkingDays++;
    cursor.setDate(cursor.getDate() + 1);
  }

  const absentDays = Math.max(totalWorkingDays - presentDays, 0);

  return { presentDays, absentDays, totalWorkingDays, overtimeHours: 0 };
};

export { calcPayroll, getAttendanceSummary };