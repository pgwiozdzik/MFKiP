import React, { useState, useEffect, useCallback } from 'react';
import { apiService } from '../../api/apiService.js';
import '../../assets/styles/table.css';

const Volunteers = () => {
    const [volunteers, setVolunteers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState(null);
    const [editData, setEditData] = useState({});
    const [newVol, setNewVol] = useState({ name: '', phone: '' });

    const fetchVolunteers = useCallback(async () => {
        try {
            const data = await apiService.getAllVolunteers();
            setVolunteers(data);
            setLoading(false);
        } catch (error) {
            console.error("Błąd pobierania wolontariuszy:", error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchVolunteers();
    }, [fetchVolunteers]);

    const handleAddSubmit = async (e) => {
        e.preventDefault();
        if (!newVol.name.trim()) return;
        try {
            await apiService.createVolunteer(newVol);
            setNewVol({ name: '', phone: '' });
            fetchVolunteers();
        } catch (error) {
            alert("Błąd podczas dodawania wolontariusza");
        }
    };

    const handleEditClick = (vol) => {
        setEditingId(vol.id);
        setEditData({ ...vol });
    };

    const handleSaveEdit = async (id) => {
        try {
            await apiService.updateVolunteer(id, editData);
            setEditingId(null);
            fetchVolunteers();
        } catch (error) {
            alert("Błąd zapisu danych wolontariusza");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Czy na pewno chcesz usunąć tego wolontariusza?")) {
            try {
                await apiService.deleteVolunteer(id);
                fetchVolunteers();
            } catch (error) {
                alert("Nie można usunąć wolontariusza (prawdopodobnie jest przypisany do występu)");
            }
        }
    };

    if (loading) return <div className="admin-tab-content">Ładowanie listy wolontariuszy...</div>;

    return (
        <div className="table-container">
            <table className="table-custom table-reception">
                <thead>
                <tr>
                    <th style={{ width: '80px' }}>ID</th>
                    <th className="col-performer">Imię i Nazwisko</th>
                    <th style={{ width: '200px' }}>Telefon</th>
                    <th className="col-actions">Akcje</th>
                </tr>
                </thead>
                <tbody>
                {volunteers.map(vol => {
                    const isEditing = editingId === vol.id;

                    return (
                        <tr key={vol.id}>
                            <td>{vol.id}</td>
                            <td>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={editData.name}
                                        onChange={(e) => setEditData({...editData, name: e.target.value})}
                                    />
                                ) : (
                                    <strong>{vol.name}</strong>
                                )}
                            </td>
                            <td>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="input-field"
                                        value={editData.phone}
                                        onChange={(e) => setEditData({...editData, phone: e.target.value})}
                                    />
                                ) : (
                                    <a href={`tel:${vol.phone}`} className="phone-link">
                                        {vol.phone}
                                    </a>
                                )}
                            </td>

                            <td className="col-actions">
                                {isEditing ? (
                                    <div className="action-buttons editing">
                                        <button onClick={() => handleSaveEdit(vol.id)} className="btn btn-ok">OK</button>
                                        <button onClick={() => setEditingId(null)} className="btn btn-cancel">X</button>
                                    </div>
                                ) : (
                                    <div className="utility-actions">
                                        <button className="btn btn-edit" onClick={() => handleEditClick(vol)}>✎</button>
                                        <button className="btn btn-cancel" onClick={() => handleDelete(vol.id)}>🗑</button>
                                    </div>
                                )}
                            </td>
                        </tr>
                    );
                })}
                {volunteers.length === 0 && (
                    <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#ccc' }}>
                            Brak wolontariuszy w bazie danych.
                        </td>
                    </tr>
                )}
                </tbody>
            </table>

            <div className="add-section">
                <form className="add-panel" onSubmit={handleAddSubmit}>
                    <input
                        type="text"
                        placeholder="Imię i Nazwisko"
                        className="input-field"
                        style={{ flex: 2 }}
                        value={newVol.name}
                        onChange={(e) => setNewVol({...newVol, name: e.target.value})}
                        required
                    />
                    <input
                        type="text"
                        placeholder="Telefon"
                        className="input-field"
                        style={{ flex: 1 }}
                        value={newVol.phone}
                        onChange={(e) => setNewVol({...newVol, phone: e.target.value})}
                    />
                    <button type="submit" className="btn btn-ok">+ DODAJ</button>
                </form>
            </div>
        </div>
    );
};

export default Volunteers;