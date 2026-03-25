import React, { useState, useEffect } from 'react';
import { STATUS_CONFIG } from '../config/statusConfig';
import { apiService } from '../api/apiService.js';
import { useWebSockets } from '../hooks/useWebSockets.js';

const Overview = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        try {
            const data = await apiService.getAllPerformances();
            setSchedule(data);
            setLoading(false);
        } catch (err) {
            setError("W oczekiwaniu na kolejną edycję");
            setLoading(false);
        }
    };

    // WYWOŁANIE HOOKA:
    // Subskrybujemy kanał i mówimy co zrobić, gdy przyjdzie "UPDATE"
    useWebSockets('/topic/performances', (message) => {
        if (message === "UPDATE") {
            console.log("WS: Odświeżam dane Overview...");
            loadData();
        }
    });

    useEffect(() => {
        loadData();
    }, []);

    const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : "--:--";

    if (loading) return <div className="wrapper">Inicjalizacja...</div>;
    if (error) return <div className="wrapper error-message">{error}</div>;

    return (
        <div className="wrapper">
            <div className="table-container">
                <table className="table-custom table-view-overview">
                    <thead>
                    <tr>
                        <th className="col-time">Planowa</th>
                        <th className="col-performer">Wykonawca</th>
                        <th className="col-status">Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {schedule.map(row => (
                        <tr key={row.id} className={row.isBreak ? 'row-break' : ''}>
                            <td className="col-time">{formatTime(row.plannedStartTime)}</td>
                            <td className="col-performer">
                                {row.isBreak ? <strong>{row.performerName}</strong> : row.performerName}
                            </td>
                            <td className="col-status">
                                    <span className={`status-badge badge-${row.status}`}>
                                        {STATUS_CONFIG[row.status]?.label || row.status}
                                    </span>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Overview;