const formations = {
  "4-4-2": [4, 4, 2],
  "4-3-3": [4, 3, 3],
  "3-5-2": [3, 5, 2],
  "5-3-2": [5, 3, 2],
  "4-5-1": [4, 5, 1],
  "3-4-3": [3, 4, 3],
  "4-2-3-1": [4, 2, 3, 1],
  "5-4-1": [5, 4, 1],
  "3-6-1": [3, 6, 1],
  "4-1-4-1": [4, 1, 4, 1],
  "4-3-2-1": [4, 3, 2, 1],
  "3-3-3-1": [3, 3, 3, 1],
  "5-2-2-1": [5, 2, 2, 1],
  "3-2-3-2": [3, 2, 3, 2],
  "2-5-3": [2, 5, 3]
};

const teamGrid = document.getElementById("team-grid");
const formationSelect = document.getElementById("formationSelect");
const teamSelect = document.getElementById("teamSelect");

let currentTeam = "besiktas";
let allPlayers = [];

// Dizilişleri ekle
for (const key in formations) {
  const option = document.createElement("option");
  option.value = key;
  option.textContent = key;
  formationSelect.appendChild(option);
}

// Takım ve diziliş değişimi
formationSelect.addEventListener("change", (e) => {
  renderFormation(e.target.value);
});
teamSelect.addEventListener("change", (e) => {
  currentTeam = e.target.value;
  renderFormation(formationSelect.value);
});

// Slotları çiz
function renderFormation(name) {
  teamGrid.innerHTML = "";

  const structure = formations[name];
  const totalRows = structure.length + 1;

  // Kaleci
  const gkSlot = createSlot("kaleci", (1 / (totalRows + 1)) * 100, 50);
  teamGrid.appendChild(gkSlot);

  // Diğer diziliş
  structure.forEach((count, index) => {
    const rowY = ((index + 2) / (totalRows + 1)) * 100;

    for (let i = 0; i < count; i++) {
      const left = ((i + 1) / (count + 1)) * 100;
      const slot = createSlot("oyuncu", rowY, left);
      teamGrid.appendChild(slot);
    }
  });
}

// Slot oluştur (her slot için tekrar kullanılabilir)
function createSlot(type, top, left) {
  const slot = document.createElement("div");
  slot.className = "player-slot";
  slot.dataset.slotType = type;
  slot.style.top = `${top}%`;
  slot.style.left = `${left}%`;
  slot.style.transform = "translate(-50%, -50%)";
  slot.style.backgroundImage = `url('assets/forms/${currentTeam}.png')`;

  makeSlotDroppable(slot);

  // Silme butonu
  const removeBtn = document.createElement("div");
  removeBtn.className = "remove-btn";
  removeBtn.textContent = "✖";
  removeBtn.title = "Kaldır";
  removeBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    slot.innerHTML = "";
    slot.classList.remove("filled");
    slot.appendChild(removeBtn);
  });

  slot.appendChild(removeBtn);

  return slot;
}

// Drop işlemleri
function makeSlotDroppable(slot) {
  slot.addEventListener("dragover", (e) => {
    e.preventDefault();
  });

  slot.addEventListener("drop", (e) => {
    e.preventDefault();
    if (slot.classList.contains("filled")) return;
    const playerId = e.dataTransfer.getData("player-id");
    assignPlayerToSpecificSlot(playerId, slot);
  });
}

// Belirli slot'a oyuncu atama
function assignPlayerToSpecificSlot(playerId, slot) {
  const player = allPlayers.find(p => p.ID == playerId);
  if (!player) return;

  const nameTag = document.createElement("span");
  nameTag.className = "player-name";
  nameTag.textContent = `${player.Forename[0]}. ${player.Surname}`;

  if (player.ImageURL) {
    const img = document.createElement("img");
    img.src = player.ImageURL;
    img.className = "player-photo";
    slot.appendChild(img);
  }

  slot.appendChild(nameTag);
  slot.classList.add("filled");
}

// İlk boş slot'a (tıklamayla) atama
function assignPlayerToSlot(player) {
  const slots = document.querySelectorAll(".player-slot");

  for (let slot of slots) {
    if (!slot.classList.contains("filled")) {
      assignPlayerToSpecificSlot(player.ID, slot);
      break;
    }
  }
}

// Oyuncu kartlarını göster
function displayPlayers(players) {
  const container = document.getElementById("player-selection");
  container.innerHTML = "";

  players.forEach(player => {
    const card = document.createElement("div");
    card.className = "player-card";
    card.draggable = true;

    card.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("player-id", player.ID);
    });

    const img = document.createElement("img");
    img.src = player.ImageURL || "assets/default-player.png";
    img.alt = player.Surname;

    const name = document.createElement("span");
    name.textContent = `${player.Forename} ${player.Surname}`;

    card.appendChild(img);
    card.appendChild(name);
    container.appendChild(card);

    card.addEventListener("click", () => {
      assignPlayerToSlot(player);
    });
  });
}

// Oyuncuları JSON'dan yükle
async function loadPlayers() {
  const response = await fetch("data/SoccerWiki_2025-05-19_1747681406.json");
  const data = await response.json();
  allPlayers = data.PlayerData;
  displayPlayers(allPlayers.slice(0, 50));
}

// Filtreleme (isimle)
document.getElementById("applyFilters").addEventListener("click", () => {
  const name = document.getElementById("searchName").value.toLowerCase();

  const filtered = allPlayers.filter(player => {
    const fullName = `${player.Forename} ${player.Surname}`.toLowerCase();
    return fullName.includes(name);
  });

  displayPlayers(filtered.slice(0, 50));
});

document.getElementById("saveTeamBtn").addEventListener("click", () => {
  const slots = document.querySelectorAll(".player-slot");
  const squad = [];

  slots.forEach(slot => {
    const nameTag = slot.querySelector(".player-name");
    const photo = slot.querySelector(".player-photo");

    if (nameTag) {
      squad.push({
        name: nameTag.textContent,
        image: photo ? photo.src : null
      });
    } else {
      squad.push(null); // boş slot
    }
  });

  localStorage.setItem("savedSquad", JSON.stringify(squad));
  alert("Kadron kaydedildi!");
});


document.getElementById("exportImageBtn").addEventListener("click", () => {
  const node = document.getElementById("team-grid");

  html2canvas(node, {
    useCORS: true,   // dış resimleri çekmek için
    backgroundColor: null, 
    scale: 4         // HD kalite için büyütme
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = "ruya-kadro.png";       // indirilecek dosya adı
    link.href = canvas.toDataURL();         // PNG olarak dönüştür
    link.click();                           // otomatik indir
  });
});



// Sayfa açılış
renderFormation("4-4-2");
loadPlayers();
