import React, { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../api/apiService.js';
import { STATUS_CONFIG } from '../config/statusConfig';
import { useWebSockets } from '../hooks/useWebSockets.js';
import { calculatePredictedTimes, getPredictedTimeData } from '../config/timeUtils.js';
import '../assets/styles/table.css';

const Reception = () => {
    const [performances, setPerformances] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [isBreakModalOpen, setIsBreakModalOpen] = useState(false);

    const [reorderModal, setReorderModal] = useState({
        isOpen: false,
        perf: null,
        direction: null
    });

    const tableContainerRef = useRef(null);
    const hasAutoScrolled = useRef(false);
    const confirmButtonRef = useRef(null); // Ref dla przycisków "ZAPISZ..."

    useEffect(() => {
        if ((isBreakModalOpen || reorderModal.isOpen) && confirmButtonRef.current) {
            setTimeout(() => {
                confirmButtonRef.current.focus();
            }, 50);
        }
    }, [isBreakModalOpen, reorderModal.isOpen]);

    const loadData = useCallback(async () => {
        try {
            const activeDay = await apiService.getActiveDay();
            const [perfData, volData] = await Promise.all([
                apiService.getPerformancesByDay(activeDay.id),
                apiService.getAllVolunteers()
            ]);

            const sorted = [...perfData].sort((a, b) => {
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
            setVolunteers(volData);
            setLoading(false);
        } catch (error) {
            console.error("Błąd ładowania danych recepcji:", error);
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
                const stickyHeaderHeight = 75;
                container.scrollTo({
                    top: rowElement.offsetTop - stickyHeaderHeight,
                    behavior: 'smooth'
                });
            }
        }
        hasAutoScrolled.current = true;
    }, [performances, loading]);

    const handleEditClick = (perf) => {
        setEditingId(perf.id);
        setEditData({ ...perf });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditData({});
    };

    const handleSave = async (id) => {
        try {
            const payload = { ...editData };

            if (payload.plannedStartTime && payload.plannedStartTime.length === 5) {
                payload.plannedStartTime += ":00";
            }

            if (payload.day && payload.day.id) {
                payload.day = { id: payload.day.id };
            }

            if (payload.volunteer && payload.volunteer.id) {
                payload.volunteer = { id: payload.volunteer.id };
            } else {
                payload.volunteer = null;
            }

            await apiService.updatePerformance(id, payload);
            setEditingId(null);
        } catch (error) {
            console.error("Szczegóły błędu serwera:", error.response?.data);
            alert("Błąd zapisu danych. Sprawdź konsolę przeglądarki (F12 -> Network).");
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await apiService.updatePerformanceStatus(id, newStatus);
        } catch (error) {
            alert("Nie udało się zmienić statusu");
        }
    };

    const handleOrderChange = (perf, direction) => {
        setReorderModal({ isOpen: true, perf: perf, direction: direction });
    };

    const confirmOrderChange = async () => {
        const { perf, direction } = reorderModal;
        try {
            await apiService.reorderPerformance(perf.id, direction);
            setReorderModal({ isOpen: false, perf: null, direction: null });
        } catch (error) {
            console.error("Błąd zmiany kolejności:", error);
            alert("Nie udało się zmienić kolejności.");
            setReorderModal({ isOpen: false, perf: null, direction: null });
        }
    };

    const renderPredictedTime = (perf) => {
        const { time, color, isActual } = getPredictedTimeData(perf);
        return (
            <span style={{ color, fontStyle: isActual ? 'normal' : 'italic' }}>
                {time}
            </span>
        );
    };

    const [breakTimes, setBreakTimes] = useState({ start: '', end: '' });

    const handleAddBreak = async () => {
        if (!breakTimes.start || !breakTimes.end) {
            alert("Proszę uzupełnić obie godziny (OD i DO)");
            return;
        }
        try {
            const activeDay = await apiService.getActiveDay();
            if (!activeDay) return alert("Brak aktywnego dnia!");
            const newBreak = {
                performerName: "PRZERWA DO " + breakTimes.end,
                plannedStartTime: breakTimes.start + ":00",
                endTime: breakTimes.end + ":00",
                status: 'at-stage',
                isBreak: true,
                day: { id: activeDay.id }
            };
            await apiService.addPerformance(newBreak);
            setBreakTimes({ start: '', end: '' });
            setIsBreakModalOpen(false);
        } catch (error) {
            console.error("Błąd dodawania przerwy:", error);
            alert("Nie udało się dodać przerwy");
        }
    };

    if (loading) return <div className="wrapper">Ładowanie danych recepcji...</div>;

    return (
        <div className="wrapper">
            <div className="table-container" ref={tableContainerRef}>
                <table className="table-custom table-view-reception table-reception">
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
                        <th className="col-volunteer">
                            <span className="text-desktop">Wolontariusz</span>
                            <span className="text-mobile">Wolont.</span>
                        </th>
                        <th className="col-notes hidden">Uwagi Rec.</th>
                        <th className="col-notes hidden">Uwagi Scena</th>
                        <th className="col-actions">Akcje</th>
                    </tr>
                    </thead>
                    <tbody>
                    {performances.map((perf, index) => {
                        const isEditing = editingId === perf.id;
                        const config = STATUS_CONFIG[perf.status] || {};
                        const activePerformances = performances.filter(p => (p.status !== 'after' && p.status !== 'performing'));
                        const isFirst = activePerformances.length > 0 && activePerformances[0].id === perf.id;
                        const isLast = index === performances.length - 1;

                        return (
                            <tr key={perf.id} className={`${perf.isBreak ? 'row-break' : `row-${perf.status}`} ${isEditing ? 'row-editing' : ''}`}>
                                <td className="col-time">{perf.plannedStartTime?.substring(0, 5)}</td>
                                <td className="col-time-predicted">
                                    {renderPredictedTime(perf)}
                                </td>
                                <td className="col-performer">
                                    {perf.isBreak ? <strong>{perf.performerName}</strong> : perf.performerName}
                                </td>
                                <td className="col-status">
                                    {isEditing ? (
                                        <select
                                            className="input-field"
                                            value={editData.status}
                                            onChange={(e) => setEditData({...editData, status: e.target.value})}
                                        >
                                            {Object.entries(STATUS_CONFIG)
                                                .filter(([key]) => key !== 'at-stage' && key !== 'performing' )
                                                .map(([key, val]) => (
                                                    <option key={key} value={key}>{val.label}</option>
                                                ))
                                            }
                                        </select>
                                    ) : (
                                        perf.isBreak ? "" : <span className={`status-badge ${config.class}`}>
                                            <span className="text-desktop">{config.label}</span>
                                            <span className="text-mobile">{config.short}</span>
                                        </span>
                                    )}
                                </td>
                                <td className="col-volunteer">
                                    {isEditing ? (
                                        <select
                                            className="input-field"
                                            value={editData.volunteer?.id || ""}
                                            onChange={(e) => {
                                                const vol = volunteers.find(v => v.id === parseInt(e.target.value));
                                                setEditData({...editData, volunteer: vol || null});
                                            }}
                                        >
                                            <option value="">BRAK</option>
                                            {volunteers.map(v => (
                                                <option key={v.id} value={v.id}>{v.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div>
                                            {perf.volunteer ? (
                                                <>
                                                    <div>{perf.volunteer.name}</div>
                                                    <small style={{ color: 'var(--link-color)' }}>
                                                        <a href={`tel:${perf.volunteer.phone}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                            {perf.volunteer.phone}
                                                        </a>
                                                    </small>
                                                </>
                                            ) : <span></span>}
                                        </div>
                                    )}
                                </td>
                                <td className="hidden">
                                    {isEditing ? (
                                        <input
                                            className="input-field"
                                            type="text"
                                            value={editData.noteReception || ''}
                                            onChange={(e) => setEditData({...editData, noteReception: e.target.value})}
                                        />
                                    ) : (
                                        perf.noteReception
                                    )}
                                </td>
                                <td className="note-stage-cell hidden">{perf.noteStage}</td>

                                <td className="col-actions">
                                    <div className="action-buttons-wrapper">
                                        {isEditing ? (
                                            <div className="status-actions"> </div>
                                        ) : (
                                            <div className="status-actions">
                                                {perf.status === 'none' && (
                                                    <>
                                                        <button onClick={() => handleStatusChange(perf.id, 'arrived_school')} className="btn btn-arrived">W SZKOLE</button>
                                                        <button onClick={() => handleStatusChange(perf.id, 'arrived_venue')} className="btn btn-arrived">W ARENIE</button>
                                                    </>
                                                )}

                                                {(perf.status === 'arrived_school' || perf.status === 'arrived_venue') && (
                                                    <button onClick={() => handleStatusChange(perf.id, 'called')} className="btn btn-call">WEZWIJ</button>
                                                )}

                                                {perf.status === 'called' && (
                                                    <button onClick={() => handleStatusChange(perf.id, 'coming')} className="btn btn-coming">W DRODZE</button>
                                                )}

                                                {(perf.status === 'arrived_venue' || perf.status === 'arrived_school' || perf.status === 'called' || perf.status === 'coming') && (
                                                    <button onClick={() => {
                                                        const prevMap = {
                                                            'arrived_school': 'none',
                                                            'arrived_venue': 'none',
                                                            'called': 'arrived_venue',
                                                            'coming': 'called'
                                                        };
                                                        handleStatusChange(perf.id, prevMap[perf.status] || 'none');
                                                    }} className="btn btn-primary">COFNIJ</button>
                                                )}
                                            </div>
                                        )}

                                        {isEditing ? (
                                            <div className="utility-actions">
                                                <button onClick={handleCancelEdit} className="btn btn-cancel">X</button>
                                                <button onClick={() => handleSave(perf.id)} className="btn btn-ok">OK</button>
                                                <button className="btn btn-cancel" style={{ visibility: "hidden" }}>xf</button>
                                            </div>
                                        ) : (
                                            <div className="utility-actions">
                                                {perf.status !== 'performing' && (
                                                    <>
                                                        <button
                                                            onClick={() => handleEditClick(perf)}
                                                            className={`btn btn-edit ${(perf.isBreak || perf.status === 'at-stage') ? 'invisible' : ''}`}
                                                        >
                                                            ✎
                                                        </button>

                                                        <div className="order-actions">
                                                            <button
                                                                onClick={() => handleOrderChange(perf, 'up')}
                                                                className={`btn btn-order ${(perf.status === 'after' || isFirst) ? 'invisible' : ''}`}
                                                            >
                                                                ▲
                                                            </button>
                                                            <button
                                                                onClick={() => handleOrderChange(perf, 'down')}
                                                                className={`btn btn-order ${(perf.status === 'after' || isLast) ? 'invisible' : ''}`}
                                                            >
                                                                ▼
                                                            </button>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <div className="add-section">
                <button className="btn btn-primary" onClick={() => setIsBreakModalOpen(true)}>
                    + DODAJ PRZERWĘ
                </button>

                {isBreakModalOpen && (
                    <div className="modal-overlay">
                        <div className="modal-content">
                            <h3>Dodaj nową przerwę</h3>
                            <div className="modal-body">
                                <div className="input-group">
                                    <label>Od godziny:</label>
                                    <input
                                        type="time"
                                        className="input-field"
                                        value={breakTimes.start}
                                        onChange={(e) => setBreakTimes({...breakTimes, start: e.target.value})}
                                    />
                                </div>
                                <div className="input-group">
                                    <label>Do godziny:</label>
                                    <input
                                        type="time"
                                        className="input-field"
                                        value={breakTimes.end}
                                        onChange={(e) => setBreakTimes({...breakTimes, end: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="modal-actions">
                                <button className="btn btn-cancel" onClick={() => setIsBreakModalOpen(false)}>
                                    ANULUJ
                                </button>
                                <button className="btn btn-ok" onClick={handleAddBreak} ref={confirmButtonRef}>
                                    ZAPISZ PRZERWĘ
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {reorderModal.isOpen && (
                    (() => {
                        const currentIndex = performances.findIndex(p => p.id === reorderModal.perf?.id);
                        const targetIndex = reorderModal.direction === 'up' ? currentIndex - 1 : currentIndex + 1;
                        const targetPerf = performances[targetIndex];

                        if (!targetPerf || !reorderModal.perf) return null;

                        const currentTop = reorderModal.direction === 'up' ? targetPerf : reorderModal.perf;
                        const currentBottom = reorderModal.direction === 'up' ? reorderModal.perf : targetPerf;

                        const topPred = getPredictedTimeData(currentTop);
                        const bottomPred = getPredictedTimeData(currentBottom);

                        const planTop = currentTop.plannedStartTime?.substring(0, 5);
                        const planBottom = currentBottom.plannedStartTime?.substring(0, 5);

                        const renderMiniRow = (time, pred, name, isHighlighted) => (
                            <tr className={isHighlighted ? "highlight-row" : ""}>
                                <td className="col-time">{time}</td>
                                <td className="col-time-predicted">
                                    <span style={{
                                        color: pred.color,
                                        fontStyle: pred.isActual ? 'normal' : 'italic',
                                        fontWeight: pred.isActual ? 'bold' : 'normal'
                                    }}>
                                        {pred.time}
                                    </span>
                                </td>
                                <td className="col-performer" style={{ textAlign: 'left' }}>
                                    {isHighlighted ? <strong>{name}</strong> : name}
                                </td>
                            </tr>
                        );

                        return (
                            <div className="modal-overlay">
                                <div className="modal-content" style={{ maxWidth: '600px', width: '95%' }}>
                                    <h3>Potwierdź zmianę kolejności</h3>

                                    <div className="modal-body" style={{ padding: '15px 0' }}>
                                        <div className="swap-preview-container">
                                            <div className="preview-section">
                                                <div className="preview-header">OBECNA KOLEJNOŚĆ</div>
                                                <table className="table-custom mini-table">
                                                    <thead>
                                                    <tr>
                                                        <th className="col-time">Plan.</th>
                                                        <th className="col-time-predicted">Fakt.</th>
                                                        <th className="col-performer" style={{ textAlign: 'left' }}>Wykonawca</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {renderMiniRow(planTop, topPred, currentTop.performerName, false)}
                                                    {renderMiniRow(planBottom, bottomPred, currentBottom.performerName, false)}
                                                    </tbody>
                                                </table>
                                            </div>

                                            <div className="preview-arrow">⬇️</div>

                                            <div className="preview-section preview-after">
                                                <div className="preview-header highlight-bg">NOWA KOLEJNOŚĆ</div>
                                                <table className="table-custom mini-table">
                                                    <thead>
                                                    <tr>
                                                        <th className="col-time">Plan.</th>
                                                        <th className="col-time-predicted">Fakt.</th>
                                                        <th className="col-performer" style={{ textAlign: 'left' }}>Wykonawca</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {renderMiniRow(planBottom, topPred, currentBottom.performerName, true)}
                                                    {renderMiniRow(planTop, bottomPred, currentTop.performerName, true)}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="modal-actions">
                                        <button className="btn btn-cancel" onClick={() => setReorderModal({ isOpen: false, perf: null, direction: null })}>
                                            ANULUJ
                                        </button>
                                        <button className="btn btn-ok" onClick={confirmOrderChange} ref={confirmButtonRef}>
                                            ZAPISZ ZMIANY
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })()
                )}
            </div>
        </div>
    );
};

export default Reception;