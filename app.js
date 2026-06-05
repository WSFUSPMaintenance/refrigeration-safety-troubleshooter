let devices = [];
let trees = {};
let currentTree = null;
let currentNodeId = null;

async function loadData() {
  devices = await fetch('data/devices.json').then(r => r.json());
  trees = await fetch('data/trees.json').then(r => r.json());
  renderSymptoms();
  setupSearch();
}

function renderSymptoms() {
  const el = document.getElementById('symptomButtons');
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
  window.scrollTo({ top: document.getElementById('treePanel').offsetTop, behavior: 'smooth' });
}

function renderNode() {
  const node = currentTree.nodes[currentNodeId];
  const card = document.getElementById('stepCard');
  card.innerHTML = `
    <div class="card">
      <h3>${node.device}</h3>
      <p class="meta"><strong>Question:</strong> ${node.question}</p>
      <p class="meta"><strong>Expected:</strong> ${node.expected}</p>
      <div class="choiceRow">
        <button onclick="answer('yes')">YES / VOLTAGE PRESENT / PASS</button>
        <button onclick="answer('no')">NO / VOLTAGE ABSENT / FAIL</button>
      </div>
    </div>
  `;
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
    document.getElementById('stepCard').innerHTML = `
      <div class="card ${choice === 'yes' ? 'good' : 'bad'}">
        <h3>Result</h3>
        <div class="result">${next.result}</div>
        <button onclick="renderNode()">Back to Step</button>
      </div>
    `;
  }
}

function setupSearch() {
  document.getElementById('searchBtn').onclick = search;
  document.getElementById('searchInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') search();
  });
  document.getElementById('backBtn').onclick = () => {
    document.getElementById('treePanel').classList.add('hidden');
  };
}

function search() {
  const q = document.getElementById('searchInput').value.trim().toLowerCase();
  const results = devices.filter(d =>
    JSON.stringify(d).toLowerCase().includes(q)
  );
  const el = document.getElementById('searchResults');
  if (!q || results.length === 0) {
    el.innerHTML = '<div class="card">No matching device found.</div>';
    return;
  }
  el.innerHTML = results.map(d => `
    <div class="card">
      <h3>${d.id}: ${d.description}</h3>
      <p class="meta"><strong>Drawing:</strong> ${d.drawing}, line ${d.line}</p>
      <p class="meta"><strong>Location:</strong> ${d.location}</p>
      <p class="meta"><strong>Normal:</strong> ${d.normalState}</p>
      <p class="meta"><strong>Expected Voltage:</strong> ${d.expectedVoltage}</p>
      <p class="meta"><strong>Upstream:</strong> ${(d.upstream || []).join(' → ')}</p>
      <p class="meta"><strong>Downstream:</strong> ${(d.downstream || []).join(' → ')}</p>
    </div>
  `).join('');
}

loadData();
