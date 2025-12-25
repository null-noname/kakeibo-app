const db = firebase.database();
let dbRef = null;
export let state = { years: {}, freeMemos: [] };

export const initDB = (path, onData) => {
    dbRef = db.ref(path);
    dbRef.on('value', (s) => {
        const val = s.val();
        if (val) {
            state = val;
            onData(state);
        }
    });
};

export const saveDB = (newState) => {
    if (!dbRef) return;
    state = { ...state, ...newState };
    dbRef.set(state);
    localStorage.setItem('kakeibo_backup', JSON.stringify(state));
};
