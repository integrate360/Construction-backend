import Attendance from "../models/Attendance.js";

const getAttendanceSummary = async (user, project, periodStart, periodEnd) => {
  const attendance = await Attendance.findOne({ user, project });

  if (!attendance) {
    return {
      presentDays: 0,
      absentDays: 0,
      totalWorkingDays: 0,
      totalHoursWorked: 0,
      attendanceRecords: [],
    };
  }

  const start = new Date(periodStart);
  const end = new Date(periodEnd);

  // Filter history within period
  const periodHistory = attendance.history.filter((h) => {
    const d = new Date(h.createdAt);
    return d >= start && d <= end;
  });

  // Group by date
  const byDate = {};
  for (const entry of periodHistory) {
    const date = new Date(entry.createdAt).toISOString().split("T")[0];
    if (!byDate[date]) byDate[date] = [];
    byDate[date].push(entry);
  }

  let presentDays = 0;
  let totalHoursWorked = 0;
  const attendanceRecords = [];

  for (const [date, entries] of Object.entries(byDate)) {
    const checkIn = entries.find((e) => e.attendanceType === "check-in");
    const checkOut = entries.find((e) => e.attendanceType === "check-out");

    if (checkIn && checkOut) {
      presentDays++;

      const hoursWorked =
        (new Date(checkOut.createdAt) - new Date(checkIn.createdAt)) /
        (1000 * 60 * 60);

      totalHoursWorked += hoursWorked;

      attendanceRecords.push({
        date,
        checkIn: checkIn.createdAt,
        checkOut: checkOut.createdAt,
        hoursWorked: parseFloat(hoursWorked.toFixed(2)),
        status: "present",
      });
    }
  }

  // Count working days in period (exclude Sunday)
  let totalWorkingDays = 0;
  const cursor = new Date(start);
  while (cursor <= end) {
    if (cursor.getDay() !== 0) totalWorkingDays++;
    cursor.setDate(cursor.getDate() + 1);
  }

  const absentDays = totalWorkingDays - presentDays;

  return {
    presentDays,
    absentDays,
    totalWorkingDays,
    totalHoursWorked: parseFloat(totalHoursWorked.toFixed(2)),
    attendanceRecords,
  };
};

const calcPayroll = (
  structure,
  presentDays,
  overtimeHours = 0,
  allowances = [],
  deductions = [],
  totalHoursWorked = 0,
) => {
  let basicSalary = 0;

  if (structure.salaryType === "daily") {
    basicSalary = structure.rateAmount * presentDays;
  } else if (structure.salaryType === "monthly") {
    basicSalary = structure.rateAmount;
  } else if (structure.salaryType === "hourly") {
    basicSalary = structure.rateAmount * totalHoursWorked;
  }

  const overtimePay = (structure.overtimeRate || 0) * overtimeHours;
  const totalAllowances = allowances.reduce(
    (sum, a) => sum + (a.amount || 0),
    0,
  );
  const totalDeductions = deductions.reduce(
    (sum, d) => sum + (d.amount || 0),
    0,
  );
  const grossSalary = basicSalary + overtimePay + totalAllowances;
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

export { calcPayroll, getAttendanceSummary };
