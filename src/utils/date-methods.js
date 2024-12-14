function getFirstDayOfMonth(date = Date.now()) {
    // Create a new Date object with the given date
    const firstDayOfMonth = new Date(date);

    // Set the day of the month to 1
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    return firstDayOfMonth.getTime();
}
function getLastMonth() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();
    const start = new Date(currentYear, currentMonth - 1, 1);
    const end = new Date(currentYear, currentMonth, 0);
    start.setHours(0, 0, 0, 0);
    end.setHours(11, 59, 59, 59);
    // Calculate the first day of the last 6 months
    return {
        startDate: start.getTime(),
        endDate: end.getTime(),
    };
}
function getFirstDayOfYear() {
    const currentYear = new Date().getFullYear();
    const firstDayOfYear = new Date(currentYear, 0, 1);
    firstDayOfYear.setHours(0, 0, 0, 0);
    return firstDayOfYear.getTime();
}
function getLastSixMonths() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Calculate the first day of the last 6 months
    const firstDayOfLastSixMonths = new Date(
        currentYear,
        currentMonth - 5,
        1
    );

    firstDayOfLastSixMonths.setHours(0, 0, 0, 0);

    return firstDayOfLastSixMonths.getTime();
}
function getLast12Months() {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Calculate the first day of the last 6 months
    const firstDayOfLast12Months = new Date(
        currentYear,
        currentMonth - 11,
        1
    );

    firstDayOfLast12Months.setHours(0, 0, 0, 0);

    return firstDayOfLast12Months.getTime();
}
function getLastDayOfMonth(day = Date.now()) {
    const date = new Date(day);
    // Get the month and year of the input date
    const month = date.getMonth();
    const year = date.getFullYear();

    // Create a new Date object for the first day of the next month
    const firstDayOfNextMonth = new Date(year, month + 1, 1);

    // Subtract one day from the first day of the next month to get the last day of the current month
    const lastDayOfMonth = new Date(firstDayOfNextMonth - 1);

    // Return the last day of the month
    return lastDayOfMonth.getTime();
}

const dateRangeMethods = {
    MTD: () => {
        const date = new Date();
        return {
            startDate: getFirstDayOfMonth(date),
            endDate: date.getTime(),
        };
    },
    YTD: () => {
        const date = new Date();
        console.log("YTD", getFirstDayOfYear(), date.getTime());

        return {
            startDate: getFirstDayOfYear(),
            endDate: date.getTime(),
        };
    },
    "Last 6 Months": () => {
        const date = new Date();
        return {
            startDate: getLastSixMonths(date),
            endDate: date.getTime(),
        };
    },
    "Last 12 Months": () => {
        const date = new Date();
        return {
            startDate: getLast12Months(date),
            endDate: date.getTime(),
        };
    },
    "Last Month": () => {
        return getLastMonth();
    },
};

export {
    getFirstDayOfMonth,
    getLastMonth,
    getFirstDayOfYear,
    getLastSixMonths,
    getLast12Months,
    getLastDayOfMonth,
    dateRangeMethods
}