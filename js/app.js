# app.js
```javascript
document.getElementById('inspectionForm').addEventListener('submit', function(e) {
e.preventDefault();


const operator = document.getElementById('operator').value;
const unit = document.getElementById('unit').value;
const jenis = document.getElementById('jenis').value;
const catatan = document.getElementById('catatan').value;
const waktu = new Date().toLocaleString();


const data = { operator, unit, jenis, catatan, waktu };


let stored = JSON.parse(localStorage.getItem('rekap')) || [];
stored.push(data);
localStorage.setItem('rekap', JSON.stringify(stored));


loadData();


document.getElementById('inspectionForm').reset();
});


function loadData() {
const tbody = document.getElementById('dataBody');
tbody.innerHTML = '';


const stored = JSON.parse(localStorage.getItem('rekap')) || [];


stored.forEach(row => {
const tr = document.createElement('tr');
tr.innerHTML = `
<td>${row.operator}</td>
<td>${row.unit}</td>
<td>${row.jenis}</td>
<td>${row.catatan}</td>
<td>${row.waktu}</td>
`;
tbody.appendChild(tr);
});
}


loadData();
```