import React, { useState, useEffect } from 'react';
import { STATUS_CONFIG, getRowClass } from '../config/statusConfig';
import { apiService } from '../api/apiService.js'; // Importujemy serwis

const Overview = () => {
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const loadData = async () => {
        try {
            const data = await apiService.getAllPerformances();
            setSchedule(data);
            setLoading(false);
        } catch {
            setError("W oczekiwaniu na kolejną edycję");
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (timeString) => timeString ? timeString.substring(0, 5) : "--:--";

    if (loading) return <div className="wrapper">Inicjalizacja połączenia...</div>;
    if (error) return <div className="wrapper error-message">{error}</div>;

    return (
        <div className="wrapper">
            <div className="table-container">
                {/* Nakładamy klasę specyficzną dla tego widoku */}
                <table className="table-custom table-view-overview">
                    <thead>
                    <tr>
                        <th className="col-time">Planowa</th>
                        <th className="col-performer">Wykonawca</th>
                        {/* Kolumna wolontariusza ukryta w Overview */}
                        <th className="col-volunteer hidden">Wolontariusz</th>
                        <th className="col-status">Status</th>
                    </tr>
                    </thead>
                    <tbody>
                    {schedule.map(row => (
                        <tr key={row.id}>
                            <td className="col-time">{formatTime(row.plannedStartTime)}</td>
                            <td className="col-performer">{row.performerName}</td>
                            <td className="col-volunteer hidden">{row.volunteer?.name}</td>
                            <td className="col-status">
                                <span className={`status-badge badge-${row.status}`}>
                                    {STATUS_CONFIG[row.status]?.label}
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