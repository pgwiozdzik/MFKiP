export const calculatePredictedTimes = (performances) => {
    if (!performances || performances.length === 0) return [];
    let currentDelay = 0;

    return performances.map((perf) => {
        if (!perf.plannedStartTime) return perf;

        const [planH, planM] = perf.plannedStartTime.split(':').map(Number);
        const baseDate = new Date();
        baseDate.setHours(planH, planM, 0, 0);

        const predictedDate = new Date(baseDate.getTime() + currentDelay * 60000);
        const predictedTimeStr = predictedDate.toLocaleTimeString('pl-PL', {
            hour: '2-digit', minute: '2-digit'
        });

        if (perf.actualStartTime && perf.status !== 'none' && perf.status !== 'no-show') {
            const [actH, actM] = perf.actualStartTime.split(':').map(Number);
            const actualDate = new Date();
            actualDate.setHours(actH, actM, 0, 0);
            currentDelay = Math.round((actualDate.getTime() - baseDate.getTime()) / 60000);
        }

        return { ...perf, predictedTime: predictedTimeStr };
    });
};

// Nowa funkcja pomocnicza dla widoków
export const getPredictedTimeData = (perf) => {
    if (perf.actualStartTime) {
        return {
            time: perf.actualStartTime.substring(0, 5),
            color: 'inherit',
            isActual: true
        };
    }

    const planned = perf.plannedStartTime?.substring(0, 5);
    const predicted = perf.predictedTime;

    let color = 'inherit';
    if (predicted < planned) color = 'var(--time-early)';
    else if (predicted > planned) color = 'var(--time-delay)';

    return {
        time: predicted,
        color: color,
        isActual: false
    };
};
