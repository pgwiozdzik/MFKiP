export const STATUS_CONFIG = {
    'none': { label: '', short: '', class: 'badge-none' },
    'arrived_venue': { label: 'W ARENIE', short: 'ARENA', class: 'badge-arrived' },
    'arrived_school': { label: 'W SZKOLE', short: 'SZKOŁA', class: 'badge-arrived' },
    'called': { label: 'WEZWANY', short: 'WEZW.', class: 'badge-called' },
    'coming': { label: 'W DRODZE', short: 'DROGA', class: 'badge-coming' },
    'at-stage': { label: 'POD SCENĄ', short: 'SCENA', class: 'badge-stage' },
    'performing': { label: 'WYSTĘPUJE', short: 'LIVE', class: 'badge-live' },
    'after': { label: 'PO WYSTĘPIE', short: 'PO', class: 'badge-after' },
    'no-show': { label: 'NIE DOTRZE', short: 'BRAK', class: 'badge-no-show' }
};

export const getRowClass = (status, isBreak) => {
    if (isBreak) return 'row-break';
    if (status === 'after') return 'row-after';
    if (status === 'no-show') return 'row-no-show';
    if (status === 'performing') return 'row-live';
    return `row-${status}`;
};