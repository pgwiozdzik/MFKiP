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

                // Admin widzi te same przewidywane czasy co Recepcja
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

    const isThisDayActive = dayData?.active === true || dayData?.isActive === true;

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

    const handleAddNew = async () => {
        if (!dayData?.id) return;
        const newPerf = { performerName: "Nowy Wykonawca", plannedStartTime: "12:00:00", status: 'none', day: { id: dayData.id } };
        try { await apiService.addPerformance(newPerf); } catch (e) { alert("Błąd dodawania"); }
    };

    const renderPredictedTime = (perf) => {
        const { time, color, isActual } = getPredictedTimeData(perf);
        return <span style={{ color, fontStyle: isActual ? 'normal' : 'italic', fontWeight: isActual ? 'bold' : 'normal' }}>{time}</span>;
    };

    if (loading) return <div className="admin-tab-content">Ładowanie...</div>;

    return (
        <div className="table-container">
            <table className="table-custom table-reception">
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
                        <tr key={perf.id} className={perf.isBreak ? 'row-break' : `row-${perf.status}`}>
                            <td>
                                {isEditing ? (
                                    <input type="time" step="1" className="input-field" value={editData.plannedStartTime || ""}
                                           onChange={e => setEditData({...editData, plannedStartTime: e.target.value})} />
                                ) : perf.plannedStartTime?.substring(0, 5)}
                            </td>
                            <td>{renderPredictedTime(perf)}</td>
                            <td>
                                {isEditing ? (
                                    <input type="text" className="input-field" value={editData.performerName || ""}
                                           onChange={e => setEditData({...editData, performerName: e.target.value})} />
                                ) : (perf.isBreak ? <strong>{perf.performerName}</strong> : perf.performerName)}
                            </td>
                            <td>
                                {isEditing ? (
                                    <select className="input-field" value={editData.status} onChange={e => setEditData({...editData, status: e.target.value})}>
                                        {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                    </select>
                                ) : <span className={`status-badge ${config.class}`}>{config.label}</span>}
                            </td>
                            <td>
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
                <div className="add-panel">
                    <button className="btn btn-ok" onClick={handleAddNew}>+ DODAJ WYKONAWCĘ</button>

                    {!isThisDayActive && (
                        <button className="btn btn-primary" onClick={() => onSetActiveRequest(dayData.id)}>
                            USTAW JAKO AKTYWNY DZIEŃ
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DaysTab;

