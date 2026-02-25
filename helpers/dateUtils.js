
export const getDateRangeUTC = (from, to) => {
  const dates = [];
  let current = new Date(from);

  while (current <= to) {
    dates.push(current.toISOString().split("T")[0]); // YYYY-MM-DD
    current.setUTCDate(current.getUTCDate() + 1);
  }

  return dates;
};
