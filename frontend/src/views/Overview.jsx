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
            // 1. Najpierw pobierz informacje o tym, który dzień jest aktywny
            const activeDay = await apiService.getActiveDay();

            if (!activeDay || !activeDay.id) {
                setError("Brak aktywnego dnia festiwalu");
                setLoading(false);
                return;
            }

            // 2. Pobierz występy TYLKO dla tego konkretnego dnia
            const data = await apiService.getPerformancesByDay(activeDay.id);

            // 3. Stabilne sortowanie (chronologiczne)
            const sorted = [...data].sort((a, b) => {

                const timeA = a.changedStartTime;
                const timeB = b.changedStartTime;

                const timeCompare = String(timeA).localeCompare(String(timeB));

                if (timeCompare !== 0) {
                    return timeCompare;
                }
                return a.id - b.id;
            });

            // 4. Przeliczanie czasów (opóźnienia na podstawie aktualnego stanu)
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

    // Reaguj na UPDATE z WebSocket (zarówno zmiana statusu występu, jak i zmiana aktywnego dnia przez Admina)
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
                        <th className="col-time">Planowa</th>
                        <th className="col-time-predicted">Faktyczna</th>
                        <th className="col-performer">Wykonawca</th>
                        <th className="col-status">Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {schedule
                        .filter(row => row.status !== "after")
                        .map(row => {
                        // Pobieramy dane o czasie (wartość i kolor) z centralnego pliku
                        const timeData = getPredictedTimeData(row);
                        const config = STATUS_CONFIG[row.status] || {};

                        return (
                            // Zmień w Overview.jsx wewnątrz map()
                            <tr
                                key={row.id}
                                className={`row-${row.status} ${row.isBreak ? 'row-break' : ''}`}
                            >
                                {/* Kolumna: Czas Planowany */}
                                <td className="col-time">
                                    {row.isBreak ? "" : formatTime(row.plannedStartTime)}
                                </td>

                                {/* Kolumna: Czas Faktyczny */}
                                <td className="col-time-predicted" style={{
                                    color: row.isBreak ? timeData.color : timeData.color, // Biały kolor jeśli przerwa
                                    fontStyle: timeData.isActual ? 'normal' : 'italic'
                                }}>
                                    {row.isBreak ? "" : timeData.time}
                                </td>

                                {/* Kolumna: Wykonawca */}
                                <td className="col-performer">
                                    {row.isBreak ? `${row.performerName}` : row.performerName}
                                </td>

                                {/* Kolumna: Status */}
                                <td className="col-status">
                                    {row.isBreak ? "" : (
                                        <span className={`status-badge ${config.class}`}>
                {config.label || row.status}
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