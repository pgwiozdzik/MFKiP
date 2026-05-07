import React, { useState, useEffect, useCallback } from 'react';
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

    const loadData = useCallback(async () => {
        try {
            // 1. Pobierz aktywny dzień
            const activeDay = await apiService.getActiveDay();

            // 2. Pobierz wolontariuszy oraz występy TYLKO dla aktywnego dnia
            const [perfData, volData] = await Promise.all([
                apiService.getPerformancesByDay(activeDay.id),
                apiService.getAllVolunteers()
            ]);

            // 3. Sortowanie chronologiczne
            const sorted = [...perfData].sort((a, b) => {
                if (a.plannedStartTime !== b.plannedStartTime) {
                    return a.plannedStartTime.localeCompare(b.plannedStartTime);
                }
                return a.id - b.id;
            });

            // 4. Obliczanie przewidywanych czasów
            const withPredictedTimes = calculatePredictedTimes(sorted);

            setPerformances(withPredictedTimes);
            setVolunteers(volData);
            setLoading(false);
        } catch (error) {
            console.error("Błąd ładowania danych recepcji:", error);
            setLoading(false);
        }
    }, []);

    // Reaguj na sygnał UPDATE (zmiana statusu LUB zmiana aktywnego dnia przez Admina)
    useWebSockets('/topic/performances', (message) => {
        if (message === "UPDATE") loadData();
    });

    useEffect(() => {
        loadData();
    }, [loadData]);

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
            // Tworzymy kopię danych do wysłania
            const payload = { ...editData };

            // 1. Formatujemy czas - Spring LocalTime wymaga HH:mm:ss
            if (payload.plannedStartTime && payload.plannedStartTime.length === 5) {
                payload.plannedStartTime += ":00";
            }

            // 2. Czyścimy obiekt Dnia - nie chcemy go aktualizować, tylko zachować powiązanie
            if (payload.day && payload.day.id) {
                payload.day = { id: payload.day.id };
            }

            // 3. Czyścimy obiekt Wolontariusza
            if (payload.volunteer && payload.volunteer.id) {
                payload.volunteer = { id: payload.volunteer.id };
            } else {
                payload.volunteer = null;
            }

            await apiService.updatePerformance(id, payload);
            setEditingId(null);
        } catch (error) {
            // To pomoże Ci zobaczyć co dokładnie mówi serwer w konsoli przeglądarki
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

    const handleOrderChange = async (perf, direction) => {
        try {
            await apiService.reorderPerformance(perf.id, direction);
        } catch (error) {
            console.error("Błąd zmiany kolejności:", error);
        }
    };

    const renderPredictedTime = (perf) => {
        const { time, color, isActual } = getPredictedTimeData(perf);
        return (
            <span style={{
                color,
                fontStyle: isActual ? 'normal' : 'italic',
                fontWeight: isActual ? 'bold' : 'normal'
            }}>
                {time}
            </span>
        );
    };

    // Inicjalizacja pustymi wartościami
    const [breakTimes, setBreakTimes] = useState({ start: '', end: '' });

    const handleAddBreak = async () => {
        // Prosta walidacja: sprawdź czy pola nie są puste
        if (!breakTimes.start || !breakTimes.end) {
            alert("Proszę uzupełnić obie godziny (OD i DO)");
            return;
        }

        try {
            const activeDay = await apiService.getActiveDay();
            if (!activeDay) return alert("Brak aktywnego dnia!");

            const newBreak = {
                performerName: "PRZERWA DO " + breakTimes.end,
                plannedStartTime: breakTimes.start + ":00", // Format HH:mm:ss
                endTime: breakTimes.end + ":00",
                status: 'at-stage',
                isBreak: true,
                day: { id: activeDay.id }
            };

            await apiService.addPerformance(newBreak);

            // Czyszczenie pól po sukcesie
            setBreakTimes({ start: '', end: '' });
        } catch (error) {
            console.error("Błąd dodawania przerwy:", error);
            alert("Nie udało się dodać przerwy");
        }
    };

    if (loading) return <div className="wrapper">Ładowanie danych recepcji...</div>;

    return (
        <div className="wrapper">
            <div className="table-container">
                <table className="table-custom table-view-reception table-reception">
                    <thead>
                    <tr>
                        <th className="col-time">Planowa</th>
                        <th className="col-time-predicted">Faktyczna</th>
                        <th className="col-performer">Wykonawca</th>
                        <th className="col-status">Status</th>
                        <th className="col-volunteer">Wolontariusz</th>
                        <th className="col-notes hidden">Uwagi Rec.</th>
                        <th className="col-notes hidden">Uwagi Scena</th>
                        <th className="col-actions">Akcje</th>
                    </tr>
                    </thead>
                    <tbody>
                    {performances.map((perf, index) => {
                        const isEditing = editingId === perf.id;
                        const config = STATUS_CONFIG[perf.status] || {};
                        const isFirst = index === 0;
                        const isLast = index === performances.length - 1;

                        return (
                            <tr key={perf.id} className={perf.isBreak ? 'row-break' : `row-${perf.status}`}>
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
                                            {Object.entries(STATUS_CONFIG).map(([key, val]) => (
                                                <option key={key} value={key}>{val.label}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        perf.isBreak ?"":<span className={`status-badge ${config.class}`}>
                                                {config.label}
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
                                            <option value="">Brak wolontariusza</option>
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
                                            ) : <span ></span>}
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
                                    {isEditing ? (
                                        <div className="action-buttons editing">
                                            <button onClick={() => handleSave(perf.id)} className="btn btn-ok">OK</button>
                                            <button onClick={handleCancelEdit} className="btn btn-cancel">X</button>
                                        </div>
                                    ) : (
                                        <div className="action-buttons-wrapper">
                                            <div className="status-actions">
                                                {/* PROGRESJA STATUSÓW */}
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

                                                {/* DYNAMICZNE COFNIJ (UNDO) */}
                                                {perf.status !== 'none' && perf.status !== 'after' && perf.status !== 'at-stage' && (
                                                    <button onClick={() => {
                                                        const prevMap = {
                                                            'arrived_school': 'none',
                                                            'arrived_venue': 'none',
                                                            'called': 'arrived_venue',
                                                            'coming': 'called',
                                                            'at-stage': 'coming',
                                                            'performing': 'at-stage'
                                                        };
                                                        handleStatusChange(perf.id, prevMap[perf.status] || 'none');
                                                    }} className="btn btn-primary">COFNIJ</button>
                                                )}
                                            </div>

                                            <div className="utility-actions">
                                                {perf.isBreak ? "" :<button onClick={() => handleEditClick(perf)} className="btn btn-edit">✎</button>}
                                                <div className="order-actions">
                                                    {perf.isBreak ? "" :<button
                                                        onClick={() => handleOrderChange(perf, 'up')}
                                                        className={`btn btn-order ${isFirst ? 'invisible' : ''}`}
                                                    > ▲ </button>}
                                                    {perf.isBreak ? "" :<button
                                                        onClick={() => handleOrderChange(perf, 'down')}
                                                        className={`btn btn-order ${isLast ? 'invisible' : ''}`}
                                                    > ▼ </button>}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            <div className="add-section">
                <div className="add-panel">
                    <span>Dodaj przerwę OD:</span>
                    <input
                        type="time"
                        className="input-field"
                        value={breakTimes.start}
                        onChange={(e) => setBreakTimes({...breakTimes, start: e.target.value})}
                    />
                    <span>DO:</span>
                    <input
                        type="time"
                        className="input-field"
                        value={breakTimes.end}
                        onChange={(e) => setBreakTimes({...breakTimes, end: e.target.value})}
                    />
                    <button className="btn btn-primary" onClick={handleAddBreak}>
                        DODAJ PRZERWĘ
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Reception;