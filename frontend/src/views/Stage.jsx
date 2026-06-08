import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../api/apiService.js';
import { STATUS_CONFIG } from '../config/statusConfig';
import { useWebSockets } from '../hooks/useWebSockets.js';
import { calculatePredictedTimes, getPredictedTimeData } from '../config/timeUtils.js';
import '../assets/styles/table.css';

const Stage = () => {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);

    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        perf: null,
        newStatus: null,
        actionLabel: ''
    });

    const tableContainerRef = useRef(null);
    const hasAutoScrolled = useRef(false);

    const confirmButtonRef = useRef(null);

    useEffect(() => {
        if (statusModal.isOpen && confirmButtonRef.current) {
            setTimeout(() => {
                confirmButtonRef.current.focus();
            }, 10);
        }
    }, [statusModal.isOpen]);

    const loadData = useCallback(async () => {
        try {
            const activeDay = await apiService.getActiveDay();

            if (!activeDay || !activeDay.id) {
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

            const withPredictedTimes = calculatePredictedTimes(sorted);

            setPerformances(withPredictedTimes);
            setLoading(false);
        } catch (error) {
            console.error("Błąd ładowania Stage:", error);
            setLoading(false);
        }
    }, []);

    useWebSockets('/topic/performances', (message) => {
        if (message === "UPDATE") loadData();
    });

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        if (loading || hasAutoScrolled.current || performances.length === 0) return;

        const firstActiveIndex = performances.findIndex(p => p.status !== 'after');

        if (firstActiveIndex <= 0) {
            hasAutoScrolled.current = true;
            return;
        }

        const container = tableContainerRef.current;
        if (container) {
            const rowElement = container.querySelector(`tbody tr:nth-child(${firstActiveIndex + 1})`);
            if (rowElement) {
                const stickyHeaderHeight = 75; // Dopasowane do css tr height
                container.scrollTo({
                    top: rowElement.offsetTop - stickyHeaderHeight,
                    behavior: 'smooth'
                });
            }
        }

        hasAutoScrolled.current = true;
    }, [performances, loading]);

    const requestStatusChange = (perf, newStatus, actionLabel) => {
        setStatusModal({
            isOpen: true,
            perf: perf,
            newStatus: newStatus,
            actionLabel: actionLabel
        });
    };

    const handleStatusChange = async (perf, newStatus) => {
        if (!perf) return;

        try {
            if (newStatus === 'performing') {
                const currentPerforming = performances.find(p => p.status === 'performing');
                if (currentPerforming && currentPerforming.id !== perf.id) {
                    await apiService.updatePerformanceStatus(currentPerforming.id, 'after');
                }

                const now = new Date();
                const currentTimeString = now.toLocaleTimeString('pl-PL', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                });

                await apiService.updatePerformance(perf.id, {
                    ...perf,
                    status: 'performing',
                    actualStartTime: currentTimeString
                });
            } else {
                await apiService.updatePerformanceStatus(perf.id, newStatus);
            }
        } catch (error) {
            console.error("Szczegóły błędu 500:", error.response?.data);
            alert("Błąd zmiany statusu na scenie");
        }
    };

    const confirmStatusChange = async () => {
        const { perf, newStatus } = statusModal;

        await handleStatusChange(perf, newStatus); // Wykonanie właściwej zmiany

        setStatusModal({ isOpen: false, perf: null, newStatus: null, actionLabel: '' });
    };
    const waitingAtStage = performances.filter(p => p.status === 'at-stage');
    const firstAtStageId = waitingAtStage.length > 0 ? waitingAtStage[0].id : null;

    if (loading) return <div className="wrapper">Inicjalizacja widoku sceny...</div>;

    return (
        <div className="wrapper">
            <div className="table-container" ref={tableContainerRef}>
                <table className="table-custom table-view-stage table-stage">
                    <thead>
                    <tr>
                        <th className="col-time">Planowa</th>
                        <th className="col-time-predicted">Faktyczna</th>
                        <th className="col-performer">Wykonawca</th>
                        <th className="col-status">Status</th>
                        <th className="col-actions">Akcje</th>
                    </tr>
                    </thead>
                    <tbody>
                    {performances.map((perf) => {
                        const config = STATUS_CONFIG[perf.status] || {};

                        return (
                            <tr key={perf.id} className={perf.isBreak ? 'row-break' : `row-${perf.status}`}>
                                <td className="col-time">{perf.plannedStartTime.substring(0, 5)}</td>
                                <td className="col-time-predicted" style={{ color: getPredictedTimeData(perf).color}}>
                                    {getPredictedTimeData(perf).time}
                                </td>
                                <td className="col-performer">
                                    {perf.isBreak ? <strong>{perf.performerName}</strong> : perf.performerName}
                                </td>
                                <td className="col-status">
                                    {perf.isBreak ?"":<span className={`status-badge ${config.class}`}>
                                            {config.label}
                                        </span>}
                                </td>

                                <td className="col-actions">
                                    <div className="action-buttons-wrapper">
                                        <div className="status-actions">

                                            {/* BEZ MODALA - natychmiastowe wykonanie */}
                                            {(['arrived_school', 'arrived_venue'].includes(perf.status)) && (
                                                <button onClick={() => handleStatusChange(perf, 'called')} className="btn btn-call">
                                                    WEZWIJ
                                                </button>
                                            )}

                                            {/* Z MODALEM */}
                                            {(perf.status === 'called' || perf.status === 'coming') && (
                                                <button onClick={() => requestStatusChange(perf, 'at-stage', 'POTWIERDŹ OBECNOŚĆ')} className="btn btn-stage">
                                                    POTWIERDŹ OBECNOŚĆ
                                                </button>
                                            )}

                                            {/* Z MODALEM */}
                                            {perf.status === 'at-stage' && (
                                                <button
                                                    onClick={() => requestStatusChange(perf, 'performing', 'START')}
                                                    className="btn btn-live"
                                                    style={{ display: perf.id === firstAtStageId ? 'inline-block' : 'none' }}
                                                >
                                                    START
                                                </button>
                                            )}

                                            {/* Z MODALEM */}
                                            {perf.status === 'performing' && (
                                                <button onClick={() => requestStatusChange(perf, 'after', 'ZAKOŃCZ')} className="btn btn-after">
                                                    ZAKOŃCZ
                                                </button>
                                            )}

                                            {/* BEZ MODALA - natychmiastowe cofnięcie */}
                                            {(perf.status === 'called' || perf.status === 'at-stage') && !perf.isBreak && (
                                                <button
                                                    onClick={() => {
                                                        const prevStates = {
                                                            'called': 'arrived_venue',
                                                            'at-stage': 'coming'
                                                        };
                                                        handleStatusChange(perf, prevStates[perf.status] || 'none');
                                                    }}
                                                    className="btn btn-primary"
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

            {statusModal.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>{statusModal.actionLabel}</h3>
                        <div className="modal-body">
                            <p style={{ textAlign: 'center' }}>
                                <strong style={{ fontSize: '1.2rem', display: 'block', marginTop: '10px' }}>
                                    {statusModal.perf?.performerName}
                                </strong>
                            </p>

                            {(statusModal.actionLabel === 'START' || statusModal.actionLabel === 'ZAKOŃCZ') && (
                                <p style={{
                                    color: '#e74c3c',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    marginTop: '15px',
                                    padding: '10px',
                                }}>
                                    Uwaga: Tej akcji nie da się cofnąć!
                                </p>
                            )}

                        </div>
                        <div className="modal-actions">
                            <button className="btn btn-cancel" onClick={() => setStatusModal({ isOpen: false, perf: null, newStatus: null, actionLabel: '' })}>
                                ANULUJ
                            </button>
                            <button className="btn btn-ok" onClick={confirmStatusChange} ref={confirmButtonRef}>
                                POTWIERDŹ
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Stage;