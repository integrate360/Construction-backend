
export const calculateTotalWorkingTime = (history = []) => {
  let totalMinutes = 0;
  let lastCheckIn = null;

  // history must be sorted by createdAt ASC
  for (const entry of history) {
    const time = new Date(entry.createdAt); // ✅ UTC

    if (entry.attendanceType === "check-in") {
      lastCheckIn = time;
    }

    if (entry.attendanceType === "check-out" && lastCheckIn) {
      const diffMs = time - lastCheckIn;

      if (diffMs > 0) {
        totalMinutes += Math.round(diffMs / (1000 * 60)); // accurate minutes
      }

      lastCheckIn = null;
    }
  }

  return {
    totalMinutes,
    totalHours: Number((totalMinutes / 60).toFixed(2)),
  };
};
