import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../api/apiService.js';
import { STATUS_CONFIG } from '../config/statusConfig';
import { useWebSockets } from '../hooks/useWebSockets.js';
import '../assets/styles/table.css';

const Stage = () => {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        try {
            const data = await apiService.getAllPerformances();
            // Stabilne sortowanie (identyczne jak w pozostałych widokach)
            const sorted = [...data].sort((a, b) => {
                if (a.plannedStartTime !== b.plannedStartTime) {
                    return a.plannedStartTime.localeCompare(b.plannedStartTime);
                }
                return a.id - b.id;
            });
            setPerformances(sorted);
            setLoading(false);
        } catch (error) {
            console.error("Błąd ładowania Stage:", error);
            setLoading(false);
        }
    }, []);

    // Nasłuchiwanie na zmiany z innych stanowisk
    useWebSockets('/topic/performances', (message) => {
        if (message === "UPDATE") loadData();
    });

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleStatusChange = async (id, newStatus) => {
        try {
            await apiService.updatePerformanceStatus(id, newStatus);
            // WebSocket odświeży listę automatycznie
        } catch (error) {
            alert("Błąd zmiany statusu na scenie");
        }
    };

    if (loading) return <div className="wrapper">Inicjalizacja widoku sceny...</div>;

    return (
        <div className="wrapper">
            <div className="table-container">
                <table className="table-custom table-view-stage table-stage">
                    <thead>
                    <tr>
                        <th className="col-time">Planowa</th>
                        <th className="col-performer">Wykonawca</th>
                        <th className="col-status">Status</th>
                        <th className="col-notes hidden">Uwagi Scena</th>
                        <th className="col-actions">Akcje</th>
                    </tr>
                    </thead>
                    <tbody>
                    {performances.map((perf) => {
                        const config = STATUS_CONFIG[perf.status] || {};

                        return (
                            <tr key={perf.id} className={perf.isBreak ? 'row-break' : `row-${perf.status}`}>
                                <td className="col-time">{perf.plannedStartTime?.substring(0, 5)}</td>
                                <td className="col-performer">
                                    {perf.isBreak ? <strong>{perf.performerName}</strong> : perf.performerName}
                                </td>
                                <td className="col-status">
                                        <span className={`status-badge ${config.class}`}>
                                            {config.label}
                                        </span>
                                </td>
                                <td className="note-stage-cell hidden">
                                    {perf.noteStage}
                                </td>

                                <td className="col-actions">
                                    <div className="action-buttons-wrapper">
                                        <div className="status-actions">

                                            {/* KROK 1: Wezwanie (jeśli Recepcja zapomniała) */}
                                            {(['none', 'arrived_school', 'arrived_venue'].includes(perf.status)) && (
                                                <button onClick={() => handleStatusChange(perf.id, 'called')} className="btn-call">
                                                    WEZWIJ
                                                </button>
                                            )}

                                            {/* KROK 2: Potwierdzenie przybycia pod scenę */}
                                            {(perf.status === 'called' || perf.status === 'coming') && (
                                                <button onClick={() => handleStatusChange(perf.id, 'at-stage')} className="btn-at-stage">
                                                    POTWIERDŹ OBECNOŚĆ
                                                </button>
                                            )}

                                            {/* KROK 3: Start występu */}
                                            {perf.status === 'at-stage' && (
                                                <button onClick={() => handleStatusChange(perf.id, 'performing')} className="btn-live">
                                                    START
                                                </button>
                                            )}

                                            {/* KROK 4: Koniec występu */}
                                            {perf.status === 'performing' && (
                                                <button onClick={() => handleStatusChange(perf.id, 'after')} className="btn-after">
                                                    ZAKOŃCZ
                                                </button>
                                            )}

                                            {/* COFNIJ: Dynamiczny powrót */}
                                            {perf.status !== 'none' && perf.status !== 'after' && (
                                                <button
                                                    onClick={() => {
                                                        const prevStates = {
                                                            'called': 'arrived_venue',
                                                            'coming': 'called',
                                                            'at-stage': 'coming',
                                                            'performing': 'at-stage'
                                                        };
                                                        handleStatusChange(perf.id, prevStates[perf.status] || 'none');
                                                    }}
                                                    className="btn-reset"
                                                >
                                                    COFNIJ
                                                </button>
                                            )}
                                        </div>
                                    </div>
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

export default Stage;