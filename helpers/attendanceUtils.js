const IST_OFFSET_MINUTES = 330; // 5h 30m

const toIST = (date) =>
  new Date(new Date(date).getTime() + IST_OFFSET_MINUTES * 60 * 1000);

export const calculateTotalWorkingTime = (history = []) => {
  let totalMinutes = 0;
  let lastCheckIn = null;

  for (const entry of history) {
    const istTime = toIST(entry.createdAt);

    if (entry.attendanceType === "check-in") {
      lastCheckIn = istTime;
    }

    if (entry.attendanceType === "check-out" && lastCheckIn) {
      const diffMs = istTime - lastCheckIn;

      if (diffMs > 0) {
        totalMinutes += Math.floor(diffMs / (1000 * 60));
      }

      lastCheckIn = null;
    }
  }

  return {
    totalMinutes,
    totalHours: Number((totalMinutes / 60).toFixed(2)),
  };
};