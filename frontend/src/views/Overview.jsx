import React, { useState, useEffect, useCallback } from 'react';
import { STATUS_CONFIG } from '../config/statusConfig';
import { apiService } from '../api/apiService.js';
import { useWebSockets } from '../hooks/useWebSockets.js';
import { calculatePredictedTimes, getPredictedTimeData } from '../config/timeUtils.js';
import '../assets/styles/table.css';

const Overview = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = useCallback(async () => {
        try {
            const activeDay = await apiService.getActiveDay();

            if (!activeDay || !activeDay.id) {
                setError("Brak aktywnego dnia festiwalu");
                setLoading(false);
                return;
            }

            const data = await apiService.getPerformancesByDay(activeDay.id);

            const sorted = [...data].sort((a, b) => {
                const timeA = a.changedStartTime;
                const timeB = b.changedStartTime;
                const timeCompare = String(timeA).localeCompare(String(timeB));

                if (timeCompare !== 0) {
                    return timeCompare;
                }
                return a.id - b.id;
            });

            const withTimes = calculatePredictedTimes(sorted);

            setSchedule(withTimes);
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error("Błąd Overview:", err);
            setError("W oczekiwaniu na kolejną edycję");
            setLoading(false);
        }
    }, []);

    useWebSockets('/topic/performances', (message) => {
        if (message === "UPDATE") {
            loadData();
        }
    });

    useEffect(() => {
        loadData();
    }, [loadData]);

    const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : "--:--";

    if (loading) return <div className="wrapper">Inicjalizacja podglądu...</div>;
    if (error) return <div className="wrapper error-message">{error}</div>;

    return (
        <div className="wrapper">
            <div className="table-container">
                <table className="table-custom table-view-overview">
                    <thead>
                    <tr>
                        <th className="col-time">
                            <span className="text-desktop">Planowa</span>
                            <span className="text-mobile">Plan.</span>
                        </th>
                        <th className="col-time-predicted">
                            <span className="text-desktop">Faktyczna</span>
                            <span className="text-mobile">Fakt.</span>
                        </th>
                        <th className="col-performer">Wykonawca</th>
                        <th className="col-status">Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {schedule
                        .filter(row => (row.status !== "after" && row.status !== "no-show"))
                        .map(row => {
                            const timeData = getPredictedTimeData(row);
                            const config = STATUS_CONFIG[row.status] || {};

                            return (
                                <tr
                                    key={row.id}
                                    className={` ${row.isBreak ? 'row-break' : `row-${row.status}`}`}
                                >
                                    <td className="col-time">
                                        <strong>{row.isBreak ? "" : formatTime(row.plannedStartTime)}</strong>
                                    </td>

                                    <td className="col-time-predicted" style={{
                                        color: row.isBreak ? timeData.color : timeData.color,
                                        fontStyle: timeData.isActual ? 'normal' : 'italic'
                                    }}>
                                        {row.isBreak ? "" : timeData.time}
                                    </td>

                                    <td className="col-performer">
                                        {row.isBreak ? `${row.performerName}` : row.performerName}
                                    </td>

                                    <td className="col-status">
                                        {row.isBreak ? "" : (
                                            <span className={`status-badge ${config.class}`}>
                                                <span className="text-desktop">{config.label || row.status}</span>
                                                <span className="text-mobile">{config.short || row.status}</span>
                                            </span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Overview;
