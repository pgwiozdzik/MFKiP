export const STATUS_CONFIG = {
    'none': { label: 'Oczekuje', short: 'OCZ.', class: 'badge-none' },
    'arrived': { label: 'W Arenie / W Szkole', short: 'ARENA', class: 'badge-arrived' },
    'called': { label: 'Wezwany pod scenę', short: 'WEZW.', class: 'badge-called' },
    'coming': { label: 'W drodze pod scenę', short: 'DROGA', class: 'badge-coming' },
    'at-stage': { label: 'Oczekujący pod sceną', short: 'SCENA', class: 'badge-stage' },
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