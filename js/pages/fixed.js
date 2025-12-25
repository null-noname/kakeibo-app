import { state, saveDB } from '../services/db.js';
import { renderFixed } from './fixed-render.js';

export function init() {
    render();
    const yd = state.years[state.currentYear];
    const tog = (k, id) => {
        const btn = document.getElementById(`btn-annual-${id}`);
        btn.onclick = () => {
            yd[`isAnnual${k}Open`] = !yd[`isAnnual${k}Open`];
            saveDB({}); render();
        };
    };
    tog('Year', 'year'); tog('Month', 'month');
    const add = (id, k) => {
        document.getElementById(`btn-add-${id}`).onclick = () => {
            yd[k].push({ date: "", text: "", cost: 0 });
            saveDB({}); render();
        };
    };
    add('year', 'annualYear'); add('month', 'annualMonth');
}
function render() { renderFixed(state, render); }
