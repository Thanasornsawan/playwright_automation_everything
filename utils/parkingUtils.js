// Helper function to format date and time for input fields
function formatDateTime(date) {
    const dateStr = date.toISOString().split('T')[0];
    const timeStr = date.toTimeString().split(' ')[0].substring(0, 5);
    return { dateStr, timeStr };
}

// Helper function to create a properly formatted start date at a specific time
function createStartDate() {
    const date = new Date();
    // Set the time to 10:00 AM to avoid midnight transition issues
    date.setHours(10, 0, 0, 0);
    return date;
}

// Helper function to create end date based on hours difference
function createEndDate(startDate, hours) {
    const endDate = new Date(startDate);
    endDate.setTime(startDate.getTime() + (hours * 60 * 60 * 1000));
    return endDate;
}

// Helper function to calculate expected cost based on parking type and duration
function calculateExpectedCost(parkingType, entryDate, exitDate) {
    const hours = (exitDate.getTime() - entryDate.getTime()) / (1000 * 60 * 60);
    const days = Math.ceil(hours / 24);
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;

    switch (parkingType) {
        case 'Valet Parking':
            if (hours <= 5) return 12;
            return days * 18;

        case 'Short-Term Parking':
            if (hours <= 1) return 2;
            const additionalHalfHours = Math.ceil((hours - 1) * 2);
            const cost = 2 + additionalHalfHours;
            return Math.min(cost, 24);

        case 'Long-Term Garage Parking':
            if (weeks > 0) {
                return weeks * 72 + Math.min(remainingDays * 12, 72);
            }
            return Math.min(hours * 2, 12);

        case 'Long-Term Surface Parking':
            if (weeks > 0) {
                return weeks * 60 + Math.min(remainingDays * 10, 60);
            }
            return Math.min(hours * 2, 10);

        case 'Economy Parking':
            if (weeks > 0) {
                return weeks * 54 + Math.min(remainingDays * 9, 54);
            }
            return Math.min(hours * 2, 9);

        default:
            throw new Error('Unknown parking type');
    }
}

module.exports = {
    formatDateTime,
    createStartDate,
    createEndDate,
    calculateExpectedCost
};