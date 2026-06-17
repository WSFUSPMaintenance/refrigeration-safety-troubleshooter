let devices = [], wires = [], trees = {}, quickReference = [], chains = [], matrix = [], guided = [], drawings = [];
let currentTree = null, currentNodeId = null, currentGuide = null, currentGuideStep = null;

async function loadData() {
  try {
    devices = await fetch('data/devices.json').then(r => r.json());
    wires = await fetch('data/wires.json').then(r => r.json());
    trees = await fetch('data/trees.json').then(r => r.json());
    quickReference = await fetch('data/quick-reference.json').then(r => r.json());
    chains = await fetch('data/chains.json').then(r => r.json());
    matrix = await fetch('data/alarm-matrix.json').then(r => r.json());
    guided = await fetch('data/guided-tests.json').then(r => r.json());
    drawings = await fetch('data/drawings.json').then(r => r.json());

    setupTabs();
    setupQcmsInspection();
    setupIdentityTest();
    renderSymptoms();
    renderQuickReference();
    renderChains();
    renderMatrix();
    renderGuidedButtons();
    renderDrawingButtons();
    setupSearch();
  } catch (err) {
    document.body.insertAdjacentHTML(
      'beforeend',
      `<div class="panel bad">
        <h3>Data Load Error</h3>
        <p>${err.message}</p>
        <p>Confirm all JSON files are uploaded inside /data and drawings are uploaded inside /drawings.</p>
      </div>`
    );
  }
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.tabPanel').forEach(p => p.classList.add('hidden'));

      const panel = document.getElementById(btn.dataset.tab + 'Panel');
      if (panel) panel.classList.remove('hidden');

      const treePanel = document.getElementById('treePanel');
      if (treePanel) treePanel.classList.add('hidden');
    });
  });
}

function setupQcmsInspection() {
  const submitBtn = document.getElementById("submitInspection");
  if (!submitBtn) return;

  submitBtn.addEventListener("click", () => {
    const dept = document.getElementById("department").value;
    const floor = document.querySelector('input[name="floorCondition"]:checked')?.value;
    const equipment = document.querySelector('input[name="equipmentCondition"]:checked')?.value;
    const comments = document.getElementById("comments").value;
    const status = document.getElementById("inspectionStatus");

    if (!dept || !floor || !equipment) {
      status.innerHTML = "Please complete all required fields.";
      status.style.color = "red";
      return;
    }

    const baseUrl = "https://forms.office.com/Pages/ResponsePage.aspx?id=3JG89IfD0E6e175TItrr8LO9tidJOFRAtBCVSjfTIJdUQUlVMkM4SEgxS1NPWTRZUUlRU1RXQkxLSS4u";

    const formUrl =
      baseUrl +
      "&rb9344b3d05ed4543ae44a4869b290642=" + encodeURIComponent("QCMS Web App User") +
      "&r1b4d2b79b78f41b9a8f2f487705dcbcb=" + encodeURIComponent(dept) +
      "&rd0e7b9a2b3b1410a929537e7ffdaa148=" + encodeURIComponent("QCMS Prototype Submission") +
      "&r0de6943bbe694fd29a7c2bb651ca2542=" + encodeURIComponent(comments) +
      "&r1df9198d75624d9d9d554c92d0adca1f=" + encodeURIComponent(floor) +
      "&r922e0dfea54e49f680cf5abf11c6de6f=" + encodeURIComponent(equipment);

    status.innerHTML = "Opening Microsoft Form with inspection data...";
    status.style.color = "green";

    window.open(formUrl, "_blank");
  });
}

function setupIdentityTest() {
  const btn = document.getElementById("runIdentityTest");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const results = {
      currentUrl: window.location.href,
      hostname: window.location.hostname,
      origin: window.location.origin,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      cookiesEnabled: navigator.cookieEnabled,
      online: navigator.onLine,
      screenWidth: screen.width,
      screenHeight: screen.height,
      windowWidth: window.innerWidth,
      windowHeight: window.innerHeight,
      referrer: document.referrer,
      localStorageAvailable: typeof(Storage) !== "undefined"
    };

    document.getElementById("identityResults").textContent =
      JSON.stringify(results, null, 2);

    console.log("Identity Test Results", results);
  });
}

function setTab(tabName) {
  document.querySelectorAll('.tab').forEach(b => b.classList.remove('active'));

  const btn = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (btn) btn.classList.add('active');

  document.querySelectorAll('.tabPanel').forEach(p => p.classList.add('hidden'));

  const panel = document.getElementById(tabName + 'Panel');
  if (panel) panel.classList.remove('hidden');

  const treePanel = document.getElementById('treePanel');
  if (treePanel) treePanel.classList.add('hidden');
}

function getDrawing(ref) {
  if (!ref) return null;
  const match = String(ref).match(/RC-\d+/i);
  if (!match) return null;
  const id = match[0].toUpperCase();
  return drawings.find(d => d.id.toUpperCase() === id);
}

function drawingButtonHtml(ref, label = 'Open Drawing') {
  const d = getDrawing(ref);
  if (!d) return '';
  return `<a class="linkBtn" href="#" onclick="openDrawing('${d.id}');return false;">${label}: ${d.id}</a>`;
}

function openDrawing(id) {
  const d = drawings.find(x => x.id === id);
  if (!d) return;

  setTab('drawings');

  document.getElementById('drawingViewer').innerHTML =
    `<div class="card">
      <h3>${d.id}: ${d.title}</h3>
      <p class="meta">${d.notes || ''}</p>
      <div class="drawingToolbar">
        <a class="linkBtn" href="${d.file}" target="_blank">Open Full Size</a>
      </div>
      <img class="drawingImage" src="${d.file}" alt="${d.id} drawing">
    </div>`;

  window.scrollTo({
    top: document.getElementById('drawingsPanel').offsetTop,
    behavior: 'smooth'
  });
}

function renderDrawingButtons() {
  const el = document.getElementById('drawingButtons');
  el.innerHTML = '';

  drawings.forEach(d => {
    const btn = document.createElement('button');
    btn.textContent = `${d.id}: ${d.title}`;
    btn.onclick = () => openDrawing(d.id);
    el.appendChild(btn);
  });
}

function renderSymptoms() {
  const el = document.getElementById('symptomButtons');
  el.innerHTML = '';

  Object.keys(trees).forEach(key => {
    const btn = document.createElement('button');
    btn.textContent = trees[key].title;
    btn.onclick = () => startTree(key);
    el.appendChild(btn);
  });
}

function startTree(key) {
  currentTree = trees[key];
  currentNodeId = currentTree.start;

  document.getElementById('treePanel').classList.remove('hidden');
  document.getElementById('treeTitle').textContent = currentTree.title;

  renderNode();

  window.scrollTo({
    top: document.getElementById('treePanel').offsetTop,
    behavior: 'smooth'
  });
}

function renderNode() {
  const node = currentTree.nodes[currentNodeId];

  const choices = node.choices
    ? node.choices.map(c => `<button onclick="choose('${c.next}')">${c.label}</button>`).join('')
    : `<button onclick="answer('yes')">YES / VOLTAGE PRESENT / PASS</button>
       <button onclick="answer('no')">NO / VOLTAGE ABSENT / FAIL</button>`;

  document.getElementById('stepCard').innerHTML =
    `<div class="card">
      <h3>${node.device}</h3>
      <p class="meta"><strong>Question:</strong> ${node.question}</p>
      <p class="meta"><strong>Expected:</strong> ${node.expected}</p>
      <p class="meta"><strong>Drawing:</strong> ${node.drawing || ''} ${node.line ? '- Line ' + node.line : ''}</p>
      ${drawingButtonHtml(node.drawing)}
      <div class="choiceRow">${choices}</div>
    </div>`;
}

function choose(next) {
  currentNodeId = next;
  renderNode();
}

function answer(choice) {
  const node = currentTree.nodes[currentNodeId];
  const next = node[choice];

  if (typeof next === 'string') {
    currentNodeId = next;
    renderNode();
    return;
  }

  if (next && next.result) {
    document.getElementById('stepCard').innerHTML =
      `<div class="card ${choice === 'yes' ? 'good' : 'bad'}">
        <h3>Result</h3>
        <div class="result">${next.result}</div>
        <button onclick="renderNode()">Back to Step</button>
      </div>`;
  }
}

function normalizeSearch(v) {
  return String(v || '')
    .toLowerCase()
    .replace(/wire\s*/g, '')
    .replace(/device\s*/g, '')
    .replace(/relay\s*/g, '')
    .replace(/sensor\s*/g, '')
    .replace(/compressor\s*/g, 'cp')
    .replace(/[^a-z0-9]/g, '');
}

function searchableText(o) {
  return [
    JSON.stringify(o),
    o.id,
    o.wire,
    o.description,
    o.type,
    o.drawing,
    o.line,
    o.location,
    o.expectedVoltage,
    o.normalState,
    o.failureEffect,
    o.zone,
    o.branch
  ].filter(Boolean).join(' ');
}

function setupSearch() {
  const input = document.getElementById('searchInput');
  const btn = document.getElementById('searchBtn');

  btn.onclick = search;

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') search();
  });

  input.addEventListener('input', () => {
    if (input.value.trim().length >= 2) search();
    if (input.value.trim().length === 0) document.getElementById('searchResults').innerHTML = '';
  });

  document.getElementById('backBtn').onclick = () => {
    document.getElementById('treePanel').classList.add('hidden');
  };
}

function chainForId(id) {
  const clean = String(id || '').toLowerCase().replace('wire ', '');

  return chains.find(c =>
    c.nodes.map(n => String(n).toLowerCase().replace('wire ', '')).includes(clean) ||
    String(c.id).toLowerCase() === clean
  );
}

function search() {
  const raw = document.getElementById('searchInput').value.trim();
  const q = raw.toLowerCase();
  const nq = normalizeSearch(raw);
  const el = document.getElementById('searchResults');

  if (!raw) {
    el.innerHTML = '<div class="card warn"><strong>Enter a device, wire number, alarm, beacon, sensor, or keyword.</strong></div>';
    return;
  }

  const deviceResults = devices.filter(d =>
    searchableText(d).toLowerCase().includes(q) ||
    normalizeSearch(searchableText(d)).includes(nq)
  );

  const wireResults = wires.filter(w =>
    searchableText(w).toLowerCase().includes(q) ||
    normalizeSearch(searchableText(w)).includes(nq)
  );

  const chainResults = chains.filter(c =>
    searchableText(c).toLowerCase().includes(q) ||
    normalizeSearch(searchableText(c)).includes(nq)
  );

  const matrixResults = matrix.filter(m =>
    searchableText(m).toLowerCase().includes(q) ||
    normalizeSearch(searchableText(m)).includes(nq)
  );

  const drawingResults = drawings.filter(d =>
    searchableText(d).toLowerCase().includes(q) ||
    normalizeSearch(searchableText(d)).includes(nq)
  );

  if (
    deviceResults.length === 0 &&
    wireResults.length === 0 &&
    chainResults.length === 0 &&
    matrixResults.length === 0 &&
    drawingResults.length === 0
  ) {
    el.innerHTML =
      `<div class="card warn">
        <h3>No match found</h3>
        <p class="meta">Search entered: <strong>${raw}</strong></p>
        <p class="meta">Try: <strong>CP-05</strong>, <strong>Compressor 5</strong>, <strong>CR407</strong>, <strong>RC-4</strong>, <strong>Sensor 6</strong>, <strong>EB-MR-4</strong>, <strong>617</strong>, <strong>Debone</strong>, or <strong>HTR1</strong>.</p>
      </div>`;
    return;
  }

  let html =
    `<div class="card">
      <strong>${deviceResults.length}</strong> device,
      <strong>${wireResults.length}</strong> wire,
      <strong>${chainResults.length}</strong> chain,
      <strong>${matrixResults.length}</strong> alarm matrix,
      <strong>${drawingResults.length}</strong> drawing match(es) for "${raw}".
    </div>`;

  if (drawingResults.length) html += '<h3>Drawing Matches</h3>' + drawingResults.map(drawingCard).join('');
  if (matrixResults.length) html += '<h3>Alarm Matrix Matches</h3>' + matrixResults.map(matrixCard).join('');
  if (chainResults.length) html += '<h3>Cause Chains</h3>' + chainResults.map(chainCard).join('');
  if (deviceResults.length) html += '<h3>Devices</h3>' + deviceResults.map(deviceCard).join('');
  if (wireResults.length) html += '<h3>Wires</h3>' + wireResults.map(wireCard).join('');

  el.innerHTML = html;
}

function drawingCard(d) {
  return `<div class="card">
    <h3>${d.id}: ${d.title}</h3>
    <p class="meta">${d.notes || ''}</p>
    <a class="linkBtn" href="#" onclick="openDrawing('${d.id}');return false;">Open ${d.id}</a>
  </div>`;
}

function deviceCard(d) {
  const c = chainForId(d.id);

  const chainHtml = c
    ? `<div class="effect">
        <strong>If this drops or fails:</strong><br>
        ${c.nodes.join(' → ')}<br>
        <strong>Effect:</strong> ${c.failureEffect}
      </div>`
    : '';

  return `<div class="card">
    <h3>${d.id}: ${d.description}</h3>
    <p class="meta"><strong>Type:</strong> ${d.type || ''}</p>
    <p class="meta"><strong>Drawing:</strong> ${d.drawing}, line ${d.line}</p>
    ${drawingButtonHtml(d.drawing)}
    <p class="meta"><strong>Location:</strong> ${d.location || ''}</p>
    <p class="meta"><strong>Zone/Branch:</strong> ${d.zone || d.branch || ''}</p>
    <p class="meta"><strong>Normal:</strong> ${d.normalState || ''}</p>
    <p class="meta"><strong>Expected Voltage:</strong> ${d.expectedVoltage || ''}</p>
    <p class="meta"><strong>Upstream:</strong> ${(d.upstream || []).join(' → ')}</p>
    <p class="meta"><strong>Downstream:</strong> ${(d.downstream || []).join(' → ')}</p>
    ${chainHtml}
    <p class="meta"><strong>Fault Effect:</strong> ${d.failureEffect || ''}</p>
  </div>`;
}

function wireCard(w) {
  const c = chainForId(w.wire);

  const chainHtml = c
    ? `<div class="effect">
        <strong>If this wire is lost:</strong><br>
        ${c.nodes.join(' → ')}<br>
        <strong>Effect:</strong> ${c.failureEffect}
      </div>`
    : '';

  return `<div class="card">
    <h3>Wire ${w.wire}</h3>
    <p class="meta"><strong>Drawing:</strong> ${w.drawing}</p>
    ${drawingButtonHtml(w.drawing)}
    <p class="meta"><strong>Line:</strong> ${w.line || ''}</p>
    <p class="meta"><strong>Description:</strong> ${w.description}</p>
    <p class="meta"><strong>Expected:</strong> ${w.expectedVoltage}</p>
    <p class="meta"><strong>From:</strong> ${w.from || ''}</p>
    <p class="meta"><strong>To:</strong> ${w.to || ''}</p>
    ${chainHtml}
    <p class="meta"><strong>Notes:</strong> ${w.notes || ''}</p>
  </div>`;
}

function chainCard(c) {
  return `<div class="card chain">
    <h3>${c.title}</h3>
    <p class="meta">${c.description}</p>
    <div class="chainLine">${c.nodes.map(n => `<span class="pill">${n}</span>`).join(' → ')}</div>
    <p class="meta"><strong>Failure Effect:</strong> ${c.failureEffect}</p>
    <p class="meta"><strong>First Field Check:</strong> ${c.firstCheck}</p>
  </div>`;
}

function matrixCard(m) {
  return `<div class="card">
    <h3>${m.sensor}: ${m.area}</h3>
    <p class="meta"><strong>Drawing:</strong> ${m.drawing}, line ${m.line}</p>
    ${drawingButtonHtml(m.drawing)}
    <p class="meta"><strong>Beacon:</strong> ${m.beacon || 'None shown'}</p>
    <p class="meta"><strong>Shutdown Output:</strong> ${m.shutdown || 'None shown'}</p>
    <p class="meta"><strong>Downstream Effect:</strong> ${m.effect}</p>
    <p class="meta"><strong>First Field Check:</strong> ${m.firstCheck}</p>
  </div>`;
}

function renderChains() {
  const buttons = document.getElementById('chainButtons');
  buttons.innerHTML = '';

  chains.forEach(c => {
    const btn = document.createElement('button');
    btn.textContent = c.title;
    btn.onclick = () => {
      document.getElementById('chainResults').innerHTML = chainCard(c);
    };
    buttons.appendChild(btn);
  });
}

function renderMatrix() {
  document.getElementById('alarmMatrix').innerHTML =
    `<table class="smallTable">
      <thead>
        <tr>
          <th>Sensor</th>
          <th>Area</th>
          <th>Beacon</th>
          <th>Shutdown</th>
          <th>Effect</th>
          <th>Drawing</th>
          <th>First Check</th>
        </tr>
      </thead>
      <tbody>
        ${matrix.map(m =>
          `<tr>
            <td>${m.sensor}</td>
            <td>${m.area}</td>
            <td>${m.beacon || ''}</td>
            <td>${m.shutdown || ''}</td>
            <td>${m.effect}</td>
            <td><a href="#" onclick="openDrawing('${m.drawing}');return false;">${m.drawing}</a></td>
            <td>${m.firstCheck}</td>
          </tr>`
        ).join('')}
      </tbody>
    </table>`;
}

function renderQuickReference() {
  document.getElementById('quickReference').innerHTML =
    `<table class="smallTable">
      <thead>
        <tr>
          <th>Symptom</th>
          <th>First Check</th>
          <th>Next Action</th>
        </tr>
      </thead>
      <tbody>
        ${quickReference.map(r =>
          `<tr>
            <td>${r.symptom}</td>
            <td>${r.firstCheck}</td>
            <td>${r.next}</td>
          </tr>`
        ).join('')}
      </tbody>
    </table>`;
}

function renderGuidedButtons() {
  const el = document.getElementById('guidedButtons');
  el.innerHTML = '';

  guided.forEach(g => {
    const btn = document.createElement('button');
    btn.textContent = g.title;
    btn.onclick = () => startGuide(g.id);
    el.appendChild(btn);
  });
}

function startGuide(id) {
  currentGuide = guided.find(g => g.id === id);
  currentGuideStep = currentGuide.start;
  renderGuideStep();
}

function renderGuideStep() {
  const step = currentGuide.steps[currentGuideStep];

  document.getElementById('guidedCard').innerHTML =
    `<div class="card priority">
      <h3>${currentGuide.title}</h3>
      <h3>${step.check}</h3>
      <p class="meta"><strong>Where:</strong> ${step.where}</p>
      <p class="meta"><strong>Expected:</strong> ${step.expected}</p>
      <p class="meta"><strong>Drawing:</strong> ${step.drawing}</p>
      ${drawingButtonHtml(step.drawing)}
      <div class="meterBox">
        <button onclick="guideAnswer('present')">Voltage Present / Pass</button>
        <button onclick="guideAnswer('missing')">Voltage Missing / Fail</button>
      </div>
    </div>`;
}

function guideAnswer(state) {
  const step = currentGuide.steps[currentGuideStep];
  const next = step[state];

  if (typeof next === 'string') {
    currentGuideStep = next;
    renderGuideStep();
    return;
  }

  document.getElementById('guidedCard').innerHTML =
    `<div class="card ${state === 'present' ? 'good' : 'bad'}">
      <h3>Result</h3>
      <div class="result">${next.result}</div>
      <button onclick="renderGuideStep()">Back to Meter Check</button>
    </div>`;
}

loadData();
