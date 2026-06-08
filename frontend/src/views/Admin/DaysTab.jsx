import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../api/apiService.js';
import { STATUS_CONFIG } from '../../config/statusConfig';
import { useWebSockets } from "../../hooks/useWebSockets.js";
import { calculatePredictedTimes, getPredictedTimeData } from '../../config/timeUtils.js';

const DaysTab = ({ dayName, onSetActiveRequest }) => {
    const [dayData, setDayData] = useState(null);
    const [performances, setPerformances] = useState([]);
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [newPerf, setNewPerf] = useState({
        performerName: '',
        plannedStartTime: '12:00:00',
        volunteerId: ''
    });

    const loadTabContent = useCallback(async () => {
        try {
            const [allDays, allVols] = await Promise.all([
                apiService.getAllDays(),
                apiService.getAllVolunteers()
            ]);

            const currentDay = allDays.find(d => d.name === dayName);
            setVolunteers(allVols || []);

            if (currentDay) {
                setDayData(currentDay);
                const perfs = await apiService.getPerformancesByDay(currentDay.id);
                const safePerfs = Array.isArray(perfs) ? perfs : [];

                const sorted = safePerfs.sort((a, b) =>
                    (a.plannedStartTime || "").localeCompare(b.plannedStartTime || "")
                );

                setPerformances(calculatePredictedTimes(sorted));
            }
            setLoading(false);
        } catch (error) {
            console.error("Błąd DaysTab:", error);
            setLoading(false);
        }
    }, [dayName]);

    useWebSockets('/topic/performances', useCallback((message) => {
        if (message === "UPDATE") loadTabContent();
    }, [loadTabContent]));

    useEffect(() => {
        setLoading(true);
        loadTabContent();
    }, [loadTabContent]);

    useEffect(() => {
        setNewPerf({ performerName: '', plannedStartTime: '12:00:00', volunteerId: '' });
    }, [dayName]);

    const isThisDayActive = dayData?.active === true || dayData?.isActive === true;

    const addMinutesToTime = (timeStr, minutesToAdd) => {
        if (!timeStr) return "12:00";
        const [h, m] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(h, m + minutesToAdd, 0);

        return date.toTimeString().split(' ')[0].substring(0, 5);
    };

    const handleTimeChange = (minutes) => {
        setNewPerf(prev => ({
            ...prev,
            plannedStartTime: addMinutesToTime(prev.plannedStartTime, minutes)
        }));
    };

    const handleEdit = (perf) => {
        setEditingId(perf.id);
        setEditData({ ...perf });
    };

    const handleSave = async (id) => {
        try {
            await apiService.updatePerformance(id, editData);
            setEditingId(null);
        } catch (e) { alert("Błąd zapisu"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Usunąć wykonawcę?")) {
            try { await apiService.deletePerformance(id); } catch (e) { alert("Błąd usuwania"); }
        }
    };

    const handleAddNew = async (e) => {
        if (e) e.preventDefault();
        if (!dayData?.id || !newPerf.performerName.trim()) return;

        let formattedTime = newPerf.plannedStartTime;
        if (formattedTime.split(':').length === 2) formattedTime += ':00';

        const payload = {
            performerName: newPerf.performerName,
            plannedStartTime: formattedTime,
            status: 'none',
            day: { id: dayData.id },
            volunteer: newPerf.volunteerId ? { id: parseInt(newPerf.volunteerId) } : null,
            isBreak: false
        };

        try {
            await apiService.addPerformance(payload);

            const nextTime = addMinutesToTime(formattedTime, 10);
            setNewPerf({
                performerName: '',
                plannedStartTime: nextTime,
                volunteerId: ''
            });
        } catch (e) {
            console.error("Błąd 500:", e.response?.data);
            alert("Błąd: " + (e.response?.data || "Błąd serwera"));
        }
    };

    const renderPredictedTime = (perf) => {
        const { time, color, isActual } = getPredictedTimeData(perf);
        return <span style={{ color, fontStyle: isActual ? 'normal' : 'italic', fontWeight: isActual ? 'bold' : 'normal' }}>{time}</span>;
    };

    if (loading) return <div className="admin-tab-content">Ładowanie...</div>;

    return (
        <div className="table-container">
            <table className="table-custom table-view-admin">
                <thead>
                <tr>
                    <th className="col-time">Planowa</th>
                    <th className="col-time-predicted">Faktyczna</th>
                    <th className="col-performer">Wykonawca</th>
                    <th className="col-status">Status</th>
                    <th className="col-volunteer">Wolontariusz</th>
                    <th className="col-actions">Akcje</th>
                </tr>
                </thead>
                <tbody>
                {performances.map(perf => {
                    const isEditing = editingId === perf.id;
                    const config = STATUS_CONFIG[perf.status] || {};
                    return (
                        <tr key={perf.id} className={`${perf.isBreak ? 'row-break' : `row-${perf.status}`} ${isEditing ? 'row-editing' : ''}`}>
                            <td className="col-time">
                                {isEditing ? (
                                    <input type="time" step="1" className="input-field" value={editData.plannedStartTime || ""}
                                           onChange={e => setEditData({...editData, plannedStartTime: e.target.value})} />
                                ) : perf.plannedStartTime?.substring(0, 5)}
                            </td>
                            <td className="col-time-predicted">{renderPredictedTime(perf)}</td>
                            <td className="col-performer">
                                {isEditing ? (
                                    <input type="text" className="input-field" value={editData.performerName || ""}
                                           onChange={e => setEditData({...editData, performerName: e.target.value})} />
                                ) : (perf.isBreak ? <strong>{perf.performerName}</strong> : perf.performerName)}
                            </td>
                            <td className="col-status">
                                {isEditing ? (
                                    <select className="input-field" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                ) : <span className={`status-badge ${config.class}`}>{config.label}</span>}
                            </td>
                            <td className="col-volunteer">
                                {isEditing ? (
                                    <select className="input-field" value={editData.volunteer?.id || ""}
                                            onChange={e => {
                                                const v = volunteers.find(vol => vol.id === parseInt(e.target.value));
                                                setEditData({...editData, volunteer: v || null});
                                            }}>
                                        <option value="">Brak</option>
                                        {volunteers.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                                    </select>
                                ) : (perf.volunteer?.name || "---")}
                            </td>

                            <td className="col-actions">
                                {isEditing ? (
                                    <div className="action-buttons editing">
                                        <button onClick={() => handleSave(perf.id)} className="btn btn-ok">OK</button>
                                        <button onClick={() => setEditingId(null)} className="btn btn-cancel">X</button>
                                    </div>
                                ) : (
                                    <div className="utility-actions">
                                        <button className="btn btn-edit" onClick={() => handleEdit(perf)}>✎</button>
                                        <button className="btn btn-cancel" onClick={() => handleDelete(perf.id)}>🗑</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
                </tbody>
            </table>

            <div className="add-section admin-footer-actions">
                <form className="add-panel-refined" onSubmit={handleAddNew}>
                    <div className="time-control-group">
                        <div className="time-stepper">
                            <button type="button" onClick={() => handleTimeChange(-5)} className="btn-step"> - </button>
                            <input
                                type="time"
                                className="input-field time-input"
                                value={newPerf.plannedStartTime.substring(0, 5)} // Zawsze tniemy do HH:mm
                                onChange={(e) => setNewPerf({...newPerf, plannedStartTime: e.target.value})}
                            />
                            <button type="button" onClick={() => handleTimeChange(5)} className="btn-step"> + </button>
                        </div>
                    </div>

                    <div className="input-field-group" style={{ flex: 3 }}>
                        <input
                            type="text"
                            placeholder="Nazwa wykonawcy"
                            className="input-field"
                            value={newPerf.performerName}
                            onChange={(e) => setNewPerf({...newPerf, performerName: e.target.value})}
                            required
                        />
                    </div>

                    <div className="input-field-group" style={{ flex: 2 }}>
                        <select
                            className="input-field"
                            value={newPerf.volunteerId}
                            onChange={(e) => setNewPerf({...newPerf, volunteerId: e.target.value})}
                        >
                            <option value="">Wybierz wolontariusza...</option>
                            {volunteers.map(v => (
                                <option key={v.id} value={v.id}>{v.name}</option>
                            ))}
                        </select>
                    </div>

                    <button type="submit" className="btn btn-ok add-btn-main">
                        + DODAJ
                    </button>

                    <div className="divider"></div>

                    {!isThisDayActive && (
                        <button type="button" className="btn btn-primary activate-day-btn" onClick={() => onSetActiveRequest(dayData.id)}>
                            USTAW AKTYWNY DZIEŃ
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default DaysTab;

