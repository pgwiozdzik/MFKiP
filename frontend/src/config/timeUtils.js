export const calculatePredictedTimes = (performances) => {
    if (!performances || performances.length === 0) return [];
    let currentDelay = 0;

    return performances.map((perf, index) => {
        const timeToUse = perf.changedStartTime || perf.plannedStartTime;
        if (!timeToUse) return perf;

        const [changedH, changedM] = timeToUse.split(':').map(Number);
        const baseDate = new Date();
        baseDate.setHours(changedH, changedM, 0, 0);

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
        else if (perf.status === 'no-show') {
            if (index + 1 < performances.length) {
                const nextPerf = performances[index + 1];
                const nextTimeToUse = nextPerf.changedStartTime || nextPerf.plannedStartTime;

                if (nextTimeToUse) {
                    const [nextH, nextM] = nextTimeToUse.split(':').map(Number);
                    const nextBaseDate = new Date();
                    nextBaseDate.setHours(nextH, nextM, 0, 0);

                    const durationSaved = Math.round((nextBaseDate.getTime() - baseDate.getTime()) / 60000);

                    if (durationSaved > 0) {
                        currentDelay -= durationSaved;
                    }
                }
            }
        }

        return { ...perf, predictedTime: predictedTimeStr };
    });
};

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

    if (planned && predicted) {
        const [planH, planM] = planned.split(':').map(Number);
        const [predH, predM] = predicted.split(':').map(Number);

        const planTotalMinutes = planH * 60 + planM;
        const predTotalMinutes = predH * 60 + predM;

        const diff = predTotalMinutes - planTotalMinutes;

        const margin = 5;

        if (diff <= -margin) {
            color = 'var(--time-early)';
        } else if (diff >= margin) {
            color = 'var(--time-delay)';
        }
    }

    return {
        time: predicted,
        color: color,
        isActual: false
    };
};
