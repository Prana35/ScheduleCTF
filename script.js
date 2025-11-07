// --- Inisialisasi Elemen dan Data ---

const scheduleForm = document.getElementById('add-schedule-form');
const eventNameInput = document.getElementById('event-name');
const eventDateStartInput = document.getElementById('event-date-start'); // Diperbarui
const eventDateEndInput = document.getElementById('event-date-end'); // BARU
const countdownContainer = document.getElementById('countdown-container');

let schedules = loadSchedules();

// --- Fungsi Penyimpanan (Load/Save) ---

function loadSchedules() {
    const schedulesJSON = localStorage.getItem('mySchedules');
    return schedulesJSON ? JSON.parse(schedulesJSON) : [];
}

function saveSchedules(schedulesToSave) {
    localStorage.setItem('mySchedules', JSON.stringify(schedulesToSave));
}

// --- Fungsi CRUD (Create, Read, Update, Delete) ---

/**
 * (CREATE) Menambahkan jadwal baru
 */
function addSchedule(e) {
    e.preventDefault();
    const name = eventNameInput.value;
    const dateStart = eventDateStartInput.value; // Diperbarui
    const dateEnd = eventDateEndInput.value;   // BARU

    if (!name || !dateStart || !dateEnd) { // Diperbarui
        alert("Semua kolom tidak boleh kosong!");
        return;
    }
    
    // Validasi: Waktu berakhir harus setelah waktu mulai
    if (new Date(dateEnd) <= new Date(dateStart)) { 
        alert("Waktu berakhir harus setelah waktu mulai!");
        return;
    }

    const newSchedule = {
        id: new Date().getTime(),
        name: name,
        date: dateStart,  // 'date' kita gunakan sebagai 'dateStart'
        dateEnd: dateEnd  // BARU
    };

    schedules.push(newSchedule);
    saveSchedules(schedules);
    scheduleForm.reset();
    renderAllSchedules(); // Gambar ulang
}

/**
 * (DELETE) Menghapus jadwal berdasarkan ID
 */
function deleteSchedule(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
        return;
    }
    schedules = schedules.filter(schedule => schedule.id !== id);
    saveSchedules(schedules);
    renderAllSchedules(); // Gambar ulang
}

/**
 * (UPDATE) Menyimpan perubahan setelah edit
 */
function saveEdit(id) {
    const newName = document.getElementById(`edit-name-${id}`).value;
    const newDateStart = document.getElementById(`edit-date-start-${id}`).value; // Diperbarui
    const newDateEnd = document.getElementById(`edit-date-end-${id}`).value;   // BARU

    if (!newName || !newDateStart || !newDateEnd) { // Diperbarui
        alert("Semua kolom tidak boleh kosong!");
        return;
    }

    if (new Date(newDateEnd) <= new Date(newDateStart)) { // Validasi
        alert("Waktu berakhir harus setelah waktu mulai!");
        return;
    }

    const scheduleIndex = schedules.findIndex(s => s.id === id);

    if (scheduleIndex > -1) {
        schedules[scheduleIndex].name = newName;
        schedules[scheduleIndex].date = newDateStart; // Diperbarui
        schedules[scheduleIndex].dateEnd = newDateEnd;   // BARU
        saveSchedules(schedules);
    }
    renderAllSchedules(); // Gambar ulang
}

/**
 * (HELPER) Menukar antara mode tampilan dan mode edit
 */
function toggleEditView(id) {
    const scheduleItem = document.getElementById(`schedule-item-${id}`);
    scheduleItem.classList.toggle('is-editing');
}

// --- Fungsi Tampilan (Rendering) ---

/**
 * (HELPER) Fungsi untuk memformat tanggal target
 */
function formatTargetDate(dateString) {
    // Pengaman jika data end-date dari data lama (sebelum update) tidak ada
    if (!dateString) return "Tanggal tidak valid"; 
    
    const date = new Date(dateString);
    const options = {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    };
    return date.toLocaleDateString('id-ID', options); // Format Indonesia
}

/**
 * (READ) Menggambar kerangka HTML untuk SEMUA jadwal
 */
function renderAllSchedules() {
    countdownContainer.innerHTML = ''; // Kosongkan kontainer

    if (schedules.length === 0) {
        countdownContainer.innerHTML = '<p style="text-align: center; color: #555;">Belum ada jadwal. Silakan tambahkan di atas!</p>';
        return;
    }

    schedules.sort((a, b) => new Date(a.date) - new Date(b.date));

    schedules.forEach(schedule => {
        const scheduleElement = document.createElement('div');
        scheduleElement.classList.add('schedule-item');
        scheduleElement.id = `schedule-item-${schedule.id}`;

        // Format tanggal mulai dan berakhir
        const targetDateStartFormatted = formatTargetDate(schedule.date);
        const targetDateEndFormatted = formatTargetDate(schedule.dateEnd); // BARU

        // Pastikan 'dateEnd' ada, untuk kompatibilitas data lama
        if (!schedule.dateEnd) {
             schedule.dateEnd = schedule.date; 
        }

        scheduleElement.innerHTML = `
            <div class="display-view">
                <button class="delete-btn" onclick="deleteSchedule(${schedule.id})">X</button>
                <button class="edit-btn" onclick="toggleEditView(${schedule.id})">✏️</button>
                
                <h3>${schedule.name}</h3>
                
                <p class="target-date-start"><b>Mulai:</b> ${targetDateStartFormatted}</p>
                <p class="target-date-end"><b>Berakhir:</b> ${targetDateEndFormatted}</p>
                
                <p class="timer-label" id="timer-label-${schedule.id}"></p> 
                
                <div class="timer" id="timer-${schedule.id}">
                    </div>
            </div>

            <div class="edit-view">
                <label>Nama Acara:</label>
                <input type="text" id="edit-name-${schedule.id}" value="${schedule.name}">
                
                <label>Tanggal & Waktu Mulai:</label>
                <input type="datetime-local" id="edit-date-start-${schedule.id}" value="${schedule.date}">
                
                <label>Tanggal & Waktu Berakhir:</label>
                <input type="datetime-local" id="edit-date-end-${schedule.id}" value="${schedule.dateEnd}">
                
                <div>
                    <button class="save-btn" onclick="saveEdit(${schedule.id})">Simpan Perubahan</button>
                    <button class="cancel-btn" onclick="toggleEditView(${schedule.id})">Batal</button>
                </div>
            </div>
        `;

        countdownContainer.appendChild(scheduleElement);
    });

    updateLiveTimers(); // Update timer setelah render
}

/**
 * (LIVE) Hanya mengupdate teks timer setiap detik
 */
function updateLiveTimers() {
    const now = new Date().getTime();

    schedules.forEach(schedule => {
        const timerLabel = document.getElementById(`timer-label-${schedule.id}`);
        const timerDisplay = document.getElementById(`timer-${schedule.id}`);
        
        if (!timerDisplay || !timerLabel) return; // Lewati jika tidak di display-view

        const eventStartDate = new Date(schedule.date).getTime();
        const eventEndDate = new Date(schedule.dateEnd).getTime();
        
        let difference = 0;
        let label = "";
        let showTimer = true;

        if (now < eventStartDate) {
            // (1) Belum dimulai: Hitung mundur ke MULAI
            difference = eventStartDate - now;
            label = "DIMULAI DALAM:";
        } else if (now >= eventStartDate && now < eventEndDate) {
            // (2) Sedang berlangsung: Hitung mundur ke BERAKHIR
            difference = eventEndDate - now;
            label = "BERAKHIR DALAM:";
        } else {
            // (3) Sudah Selesai
            label = ""; // Kosongkan label
            showTimer = false;
        }

        // Update Label
        timerLabel.innerHTML = label;

        // Update Tampilan Timer
        if (showTimer) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            timerDisplay.innerHTML = `
                <div class="time-box"><span>${days}</span><span class="label">Hari</span></div>
                <div class="time-box"><span>${formatTime(hours)}</span><span class="label">Jam</span></div>
                <div class="time-box"><span>${formatTime(minutes)}</span><span class="label">Menit</span></div>
                <div class="time-box"><span>${formatTime(seconds)}</span><span class="label">Detik</span></div>
            `;
        } else {
            // Acara sudah selesai
            timerDisplay.innerHTML = `<div class="event-ended">Jadwal Telah Selesai!</div>`;
        }
    });
}

// Fungsi helper format waktu
function formatTime(time) {
    return time < 10 ? `0${time}` : time;
}

// --- Event Listeners dan Inisialisasi ---

scheduleForm.addEventListener('submit', addSchedule);
renderAllSchedules(); // Gambar semua jadwal saat load
setInterval(updateLiveTimers, 1000); // Update timer setiap detik