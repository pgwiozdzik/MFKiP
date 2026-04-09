export const STATUS_CONFIG = {
    'none': { label: 'Czekamy', short: 'Czekamy', class: 'badge-none' },
    'arrived_venue': { label: 'W Arenie', short: 'ARENA', class: 'badge-arrived' },
    'arrived_school': { label: 'W Szkole', short: 'SZKOŁA', class: 'badge-arrived' },
    'called': { label: 'Wezwany', short: 'WEZW.', class: 'badge-called' },
    'coming': { label: 'W drodze', short: 'DROGA', class: 'badge-coming' },
    'at-stage': { label: 'Pod sceną', short: 'SCENA', class: 'badge-stage' },
    'performing': { label: 'Występuje', short: 'LIVE', class: 'badge-live' },
    'after': { label: 'Po występie', short: 'PO', class: 'badge-after' },
    'no-show': { label: 'Nie dotrze', short: 'BRAK', class: 'badge-no-show' }
};

export const getRowClass = (status, isBreak) => {
    if (isBreak) return 'row-break';
    if (status === 'after') return 'row-after';
    if (status === 'no-show') return 'row-no-show';
    if (status === 'performing') return 'row-live';
    return `row-${status}`;
};