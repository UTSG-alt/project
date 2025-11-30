/* ---------------------------
   Utilities: storage helpers
   --------------------------- */
const LS_KEY = 'inspeksi_service_records_v1';

function loadRecords(){
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch(e){ return []; }
}
function saveRecords(arr){ localStorage.setItem(LS_KEY, JSON.stringify(arr)); }

/* ---------------------------
   Sidebar toggle
   --------------------------- */
function toggleSidebar(){
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('closed');
}

/* ---------------------------
   Dashboard: grouping & charts
   --------------------------- */
function groupingByRange(records, range, kind){ // kind: 'service' or 'inspection'
  // returns labels[] and values[] for Chart.js
  const now = new Date();
  const groups = {}; // label -> count
  // normalize date from record.date
  records.filter(r => r.type === kind || (kind==='service' && r.type==='both') || (kind==='inspection' && r.type==='both'))
         .forEach(r => {
    const d = new Date(r.date);
    let label = '';
    if(range === 'daily'){
      // last 7 days
      const diff = Math.floor((now - d) / 86400000);
      if(diff <= 6) label = d.toISOString().slice(0,10);
      else return;
    } else if(range === 'weekly'){
      // last 8 weeks, week label YYYY-WN
      const onejan = new Date(d.getFullYear(),0,1);
      const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay()+1)/7);
      label = `${d.getFullYear()}-W${week}`;
    } else {
      // monthly - last 12 months
      label = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
    }
    groups[label] = (groups[label]||0) + 1;
  });

  // prepare labels: deterministic order
  let labels = Object.keys(groups).sort();
  // for daily ensure last 7 days exist
  if(range === 'daily'){
    labels = [];
    for(let i=6;i>=0;i--){
      const d = new Date(); d.setDate(d.getDate()-i);
      labels.push(d.toISOString().slice(0,10));
    }
  } else if(range === 'weekly'){
    // last 8 weeks
    labels = [];
    const cur = new Date();
    for(let i=7;i>=0;i--){
      const d = new Date();
      d.setDate(d.getDate() - i*7);
      const onejan = new Date(d.getFullYear(),0,1);
      const week = Math.ceil((((d - onejan) / 86400000) + onejan.getDay()+1)/7);
      labels.push(`${d.getFullYear()}-W${week}`);
    }
  } else {
    labels = [];
    const cur = new Date();
    for(let i=11;i>=0;i--){
      const d = new Date(cur.getFullYear(), cur.getMonth()-i, 1);
      labels.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }
  }

  const values = labels.map(l => groups[l] || 0);
  return { labels, values };
}

let serviceChart=null, inspectionChart=null;
function renderDashboardCharts(){
  const range = document.getElementById('dashboardRange').value;
  const records = loadRecords();

  const svc = groupingByRange(records, range, 'service');
  const insp = groupingByRange(records, range, 'inspection');

  // Service chart
  const ctx1 = document.getElementById('serviceChart').getContext('2d');
  if(serviceChart) serviceChart.destroy();
  serviceChart = new Chart(ctx1, {
    type: 'bar',
    data: {
      labels: svc.labels,
      datasets: [{ label:'Service', data: svc.values, backgroundColor:'#f7c600' }]
    },
    options:{ responsive:true, plugins:{ legend:{display:false} } }
  });

  // Inspection chart
  const ctx2 = document.getElementById('inspectionChart').getContext('2d');
  if(inspectionChart) inspectionChart.destroy();
  inspectionChart = new Chart(ctx2, {
    type: 'bar',
    data: {
      labels: insp.labels,
      datasets: [{ label:'Inspection', data: insp.values, backgroundColor:'#3b82f6' }]
    },
    options:{ responsive:true, plugins:{ legend:{display:false} } }
  });
}

/* ---------------------------
   FORM: behavior & submission
   --------------------------- */
function setupFormBehavior(){
  const typeEl = document.getElementById('fieldType');
  const typeServiceLabel = document.getElementById('labelTypeService');
  const typeServiceSelect = document.getElementById('fieldServiceType');

  function update(){
    const v = typeEl.value;
    if(v === 'inspection'){
      typeServiceLabel.style.display = 'none';
      typeServiceSelect.value = '';
      typeServiceSelect.disabled = true;
    } else {
      typeServiceLabel.style.display = 'block';
      typeServiceSelect.disabled = false;
    }
  }
  typeEl.addEventListener('change', update);
  update();
}

function addDetailRow(){
  const tbody = document.querySelector('#detailTable tbody');
  const tr = document.createElement('tr');
  tr.innerHTML = `
    <td><input type="text" class="d-desc"></td>
    <td><input type="text" class="d-cond"></td>
    <td><input type="text" class="d-comp"></td>
    <td>
      <select class="d-action">
        <option>Repair</option><option>Replace</option><option>None</option>
      </select>
    </td>
    <td><input type="text" class="d-cgroup"></td>
    <td><input type="text" class="d-sub"></td>
    <td><button type="button" class="hapus-btn" onclick="this.closest('tr').remove()">Hapus</button></td>
  `;
  tbody.appendChild(tr);
}

function collectDetailRows(){
  const rows = [];
  document.querySelectorAll('#detailTable tbody tr').forEach(tr=>{
    const d = {
      description: tr.querySelector('.d-desc')?.value || '',
      condition: tr.querySelector('.d-cond')?.value || '',
      component: tr.querySelector('.d-comp')?.value || '',
      action: tr.querySelector('.d-action')?.value || '',
      componentGroup: tr.querySelector('.d-cgroup')?.value || '',
      subComponent: tr.querySelector('.d-sub')?.value || ''
    };
    // only push if something present (avoid empty rows)
    if(d.description || d.condition || d.component) rows.push(d);
  });
  return rows;
}

function submitMainForm(){
  const type = document.getElementById('fieldType').value;
  const date = document.getElementById('fieldDate').value || new Date().toISOString().slice(0,10);
  const unit = document.getElementById('fieldUnit').value;
  const code = document.getElementById('fieldCode').value;
  const tech = document.getElementById('fieldTech').value;
  const hm = document.getElementById('fieldHM').value;
  const serviceType = document.getElementById('fieldServiceType').value;
  const findings = document.getElementById('fieldFindings').value;
  const details = collectDetailRows();

  if(!unit){ alert('Pilih unit terlebih dahulu.'); return; }
  if((type === 'service' || type === 'both') && !serviceType){ alert('Pilih type service.'); return; }

  const rec = {
    id: Date.now().toString(36),
    type, date, unit, code, technician: tech, hourMeter: hm, serviceType, findings, details
  };

  const arr = loadRecords();
  arr.unshift(rec);
  saveRecords(arr);

  // update UI: charts + history table if open
  renderDashboardCharts();
  if(document.getElementById('historyTable')) loadHistoryTable();

  alert('Data berhasil disimpan.');
  // reset form
  document.getElementById('mainForm').reset();
  // ensure UI hides typeService if needed
  setupFormBehavior();
  // clear detail table and add one row
  document.querySelectorAll('#detailTable tbody tr').forEach(tr=>tr.remove());
  addDetailRow();
}

/* ---------------------------
   HISTORY: render table & modal
   --------------------------- */
function loadHistoryTable(){
  const tbody = document.querySelector('#historyTable tbody');
  if(!tbody) return;
  tbody.innerHTML = '';
  const arr = loadRecords();
  if(arr.length === 0){
    tbody.innerHTML = '<tr><td colspan="7" class="small">Belum ada data.</td></tr>';
    return;
  }
  arr.forEach(rec => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${rec.date}</td>
      <td>${rec.unit}</td>
      <td>${escapeHtml(rec.code||'')}</td>
      <td>${rec.hourMeter||''}</td>
      <td>${rec.type}</td>
      <td>${escapeHtml(rec.technician||'')}</td>
      <td><button class="btn" onclick='openDetail("${rec.id}")'>Detail</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function openDetail(id){
  const arr = loadRecords();
  const rec = arr.find(r=>r.id === id);
  if(!rec) return alert('Data tidak ditemukan.');
  const modal = document.getElementById('detailModal');
  const body = document.getElementById('modalBody');
  body.innerHTML = `
    <div style="display:flex;gap:12px;flex-wrap:wrap;">
      <div style="flex:1">
        <strong>Type:</strong> ${rec.type}<br>
        <strong>Date:</strong> ${rec.date}<br>
        <strong>Unit:</strong> ${rec.unit} (${escapeHtml(rec.code||'')})<br>
        <strong>HM:</strong> ${rec.hourMeter||''}<br>
        <strong>Technician:</strong> ${escapeHtml(rec.technician||'')}<br>
        <strong>Service Type:</strong> ${rec.serviceType || '-'}<br>
        <strong>Temuan:</strong> <div class="small" style="margin-top:6px">${escapeHtml(rec.findings||'-')}</div>
      </div>
    </div>
    <hr>
    <div>
      <strong>Detail Inspection:</strong>
      <table style="width:100%;border-collapse:collapse;margin-top:8px">
        <thead><tr style="background:#f7c600"><th>Description</th><th>Condition</th><th>Component</th><th>Action</th><th>Group</th><th>Sub</th></tr></thead>
        <tbody>
          ${ (rec.details && rec.details.length) ? rec.details.map(d=>`<tr><td>${escapeHtml(d.description)}</td><td>${escapeHtml(d.condition)}</td><td>${escapeHtml(d.component)}</td><td>${escapeHtml(d.action)}</td><td>${escapeHtml(d.componentGroup)}</td><td>${escapeHtml(d.subComponent)}</td></tr>`).join('') : '<tr><td colspan="6" class="small">Tidak ada detail</td></tr>' }
        </tbody>
      </table>
    </div>
  `;
  modal.classList.add('open');
}

function closeModal(){ document.getElementById('detailModal').classList.remove('open'); }

/* ---------------------------
   Helpers
   --------------------------- */
function escapeHtml(s){ return (s||'').toString().replace(/[&<>"]/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c])); }
