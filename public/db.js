let db;
let spendVersion;

const request = indexedDB.open('SpendDB', spendVersion || 2);

request.onupgradeneeded = (e) => {
    console.log('Upgrade needed in IndexDB');

    db = e.target.result;
    const { prevVersion } = e;
    const curVersion = e.curVersion || db.version;

    console.log(`DB updated from ${ prevVersion } to ${curVersion}`);


    if (db.objectStoreNames.length === 0) {
        db.createObjectStore('SpendStore', {
            keyPath: 'listID',
            autoIncrement: true,
        });
    };
};

request.onerror = (e) => console.log(`UtOh!! ${e.target.errorCode}`);

const checkDB = () => {
    console.log('check db invoked');

    let transaction = db.transaction(['SpendStore'], 'readwrite');

    const store = transaction.objectStore('SpendStore');
    
    const getAll = store.getAll();

    getAll.onsuccess = () => {
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*', 
                    'Content-Type': 'application/json',
                }
            })
            .then(response => response.json())
                .then(res => {
                    if (res.length !== 0) {
                        transaction = db.transaction(['SpendStore'], 'readwrite');
                        const currentStore = transaction.objectStore('SpendStore');

                        currentStore.clear();
                        console.log('clearing Store...');
                    };
            });
        };
    };
};

request.onsuccess = (e) => {
    console.log('success');
    db = e.target.result;

    if (navigator.onLine) {
        console.log('Woohoo! Backend online!');
        checkDB();
    };
};

const saveRecord = (rec) => {
    console.log('SaveRec() invoked');

    const transaction = db.transaction(['SpendStore'], 'readwrite');

    const store = transaction.objectStore('SpendStore');

    store.add(rec);
};

window.addEventListener('online', checkDB);