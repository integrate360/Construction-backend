export const calculateTotalWorkingTime = (history = []) => {
  let totalMinutes = 0;
  let lastCheckIn = null;

  for (const entry of history) {
    if (entry.attendanceType === "check-in") {
      lastCheckIn = new Date(entry.createdAt);
    }

    if (entry.attendanceType === "check-out" && lastCheckIn) {
      const checkOut = new Date(entry.createdAt);
      const diffMs = checkOut - lastCheckIn;

      if (diffMs > 0) {
        totalMinutes += Math.floor(diffMs / (1000 * 60));
      }

      lastCheckIn = null;
    }
  }

  return {
    totalMinutes,
    totalHours: +(totalMinutes / 60).toFixed(2),
  };
};