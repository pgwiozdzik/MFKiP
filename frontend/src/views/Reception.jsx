import React, { useState, useEffect } from 'react';
import { apiService } from '../api/apiService.js';
import '../assets/styles/table.css';

const Reception = () => {
    const [performances, setPerformances] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null); // ID wiersza w trybie edycji
    const [editData, setEditData] = useState({}); // Dane tymczasowe edytowanego wiersza

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await apiService.getAllPerformances();
            setPerformances(data);
            setLoading(false);
        } catch (error) {
            console.error("Błąd ładowania:", error);
            setLoading(false);
        }
    };

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
            // Tutaj w przyszłości wywołanie apiService.updatePerformance(id, editData)
            console.log("Zapisywanie:", editData);

            // Symulacja aktualizacji w UI
            setPerformances(performances.map(p => p.id === id ? editData : p));
            setEditingId(null);
        } catch (error) {
            alert("Błąd zapisu");
        }
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            await apiService.updatePerformanceStatus(id, newStatus);
            loadData(); // Odświeżamy listę
        } catch (error) {
            alert("Nie udało się zmienić statusu");
        }
    };

    if (loading) return <div className="wrapper">Ładowanie danych recepcji...</div>;

    return (
        <div className="wrapper">
            <div className="table-container">
                <table className="table-custom table-reception">
                    <thead>
                    <tr>
                        <th>Planowa</th>
                        <th>Wykonawca</th>
                        <th>Status</th>
                        <th>Wolontariusz</th>
                        <th>Uwagi Rec.</th>
                        <th>Uwagi Scena</th>
                        <th>Akcje</th>
                    </tr>
                    </thead>
                    <tbody>
                    {performances.map((perf) => {
                        const isEditing = editingId === perf.id;

                        return (
                            <tr key={perf.id} className={perf.isBreak ? 'row-break' : ''}>
                                {/* 1. GODZINA */}
                                <td>{perf.plannedStartTime?.substring(0, 5)}</td>

                                {/* 2. WYKONAWCA */}
                                <td>
                                    {perf.isBreak ? <strong>{perf.performerName}</strong> : perf.performerName}
                                </td>

                                {/* 3. STATUS */}
                                <td>
                                    {isEditing ? (
                                        <select
                                            value={editData.status}
                                            onChange={(e) => setEditData({...editData, status: e.target.value})}
                                        >
                                            <option value="none">Oczekuje</option>
                                            <option value="confirmed">Potwierdzony</option>
                                            <option value="after">Zakończony</option>
                                        </select>
                                    ) : (
                                        <span className={`status-badge ${perf.status}`}>
                                                {perf.status}
                                            </span>
                                    )}
                                </td>

                                {/* 4. WOLONTARIUSZ */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.vName || ''}
                                            onChange={(e) => setEditData({...editData, vName: e.target.value})}
                                        />
                                    ) : (
                                        <div>
                                            <div>{perf.vName}</div>
                                            <small>{perf.vPhone}</small>
                                        </div>
                                    )}
                                </td>

                                {/* 5. UWAGI RECEPCJA */}
                                <td>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editData.noteReception || ''}
                                            onChange={(e) => setEditData({...editData, noteReception: e.target.value})}
                                        />
                                    ) : (
                                        perf.noteReception
                                    )}
                                </td>

                                {/* 6. UWAGI SCENA (Tylko podgląd) */}
                                <td className="note-stage">{perf.noteStage}</td>

                                {/* 7. AKCJE */}
                                <td>
                                    {isEditing ? (
                                        <div className="action-buttons">
                                            <button onClick={() => handleSave(perf.id)} className="btn-ok">OK</button>
                                            <button onClick={handleCancelEdit} className="btn-cancel">X</button>
                                        </div>
                                    ) : (
                                        <div className="action-buttons">
                                            <button onClick={() => handleEditClick(perf)} className="btn-edit">✎</button>
                                            <button onClick={() => handleStatusChange(perf.id, 'confirmed')} className="btn-confirm">OBECNY</button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                    </tbody>
                </table>
            </div>

            {/* Panel dodawania przerwy (uproszczony) */}
            <div className="add-section">
                <div className="add-panel">
                    <span>Dodaj przerwę:</span>
                    <input type="time" className="input-field" />
                    <span>DO:</span>
                    <input type="time" className="input-field" />
                    <button className="btn-primary">DODAJ</button>
                </div>
            </div>
        </div>
    );
};

export default Reception;