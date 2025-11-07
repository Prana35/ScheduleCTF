// --- Inisialisasi Elemen dan Data ---

const scheduleForm = document.getElementById('add-schedule-form');
const eventNameInput = document.getElementById('event-name');
const eventDateInput = document.getElementById('event-date');
const countdownContainer = document.getElementById('countdown-container');

// Memuat jadwal dari localStorage (yang disimpan sebagai JSON string)
let schedules = loadSchedules();

// --- Fungsi Penyimpanan (Load/Save) ---

function loadSchedules() {
    const schedulesJSON = localStorage.getItem('mySchedules');
    // Parse JSON string kembali menjadi array/object
    return schedulesJSON ? JSON.parse(schedulesJSON) : [];
}

function saveSchedules(schedulesToSave) {
    // Ubah array/object menjadi JSON string untuk disimpan
    localStorage.setItem('mySchedules', JSON.stringify(schedulesToSave));
}


// --- Fungsi CRUD (Create, Read, Update, Delete) ---

/**
 * (CREATE) Menambahkan jadwal baru
 */
function addSchedule(e) {
    e.preventDefault(); 
    const name = eventNameInput.value;
    const date = eventDateInput.value;

    if (!name || !date) {
        alert("Nama acara dan tanggal tidak boleh kosong!");
        return;
    }

    const newSchedule = {
        id: new Date().getTime(), // ID unik
        name: name,
        date: date
    };

    schedules.push(newSchedule);
    saveSchedules(schedules);
    scheduleForm.reset();
    displayAllCountdowns(); // Tampilkan ulang
}

/**
 * (DELETE) Menghapus jadwal berdasarkan ID
 */
function deleteSchedule(id) {
    // Konfirmasi sebelum menghapus
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
        return;
    }
    
    schedules = schedules.filter(schedule => schedule.id !== id);
    saveSchedules(schedules);
    displayAllCountdowns(); // Tampilkan ulang
}

/**
 * (UPDATE) Menyimpan perubahan setelah edit
 */
function saveEdit(id) {
    const newName = document.getElementById(`edit-name-${id}`).value;
    const newDate = document.getElementById(`edit-date-${id}`).value;

    if (!newName || !newDate) {
        alert("Nama acara dan tanggal tidak boleh kosong!");
        return;
    }

    // Cari index jadwal yang akan diupdate
    const scheduleIndex = schedules.findIndex(s => s.id === id);
    
    if (scheduleIndex > -1) {
        // Update data di array
        schedules[scheduleIndex].name = newName;
        schedules[scheduleIndex].date = newDate;
        
        // Simpan ke localStorage
        saveSchedules(schedules);
    }
    
    // Tampilkan ulang semua jadwal (ini akan otomatis keluar dari mode edit)
    displayAllCountdowns();
}

/**
 * (HELPER) Menukar antara mode tampilan dan mode edit
 */
function toggleEditView(id) {
    const scheduleItem = document.getElementById(`schedule-item-${id}`);
    scheduleItem.classList.toggle('is-editing');
}


// --- Fungsi Utama untuk Tampilan (Read) ---

/**
 * (READ) Fungsi utama untuk menampilkan semua countdown
 * Ini akan berjalan setiap detik untuk mengupdate timer
 */
function displayAllCountdowns() {
    const now = new Date().getTime();
    countdownContainer.innerHTML = ''; // Kosongkan kontainer

    if (schedules.length === 0) {
        countdownContainer.innerHTML = '<p style="text-align: center; color: #555;">Belum ada jadwal. Silakan tambahkan di atas!</p>';
        return;
    }

    // Urutkan jadwal (paling dekat di atas)
    schedules.sort((a, b) => new Date(a.date) - new Date(b.date));

    schedules.forEach(schedule => {
        const eventDate = new Date(schedule.date).getTime();
        const difference = eventDate - now;

        // Buat elemen HTML
        const scheduleElement = document.createElement('div');
        scheduleElement.classList.add('schedule-item');
        scheduleElement.id = `schedule-item-${schedule.id}`; // Beri ID unik

        let timerHtml;

        // Perhitungan waktu
        if (difference > 0) {
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            timerHtml = `
                <div class="timer">
                    <div class="time-box"><span>${days}</span><span class="label">Hari</span></div>
                    <div class="time-box"><span>${formatTime(hours)}</span><span class="label">Jam</span></div>
                    <div class="time-box"><span>${formatTime(minutes)}</span><span class="label">Menit</span></div>
                    <div class="time-box"><span>${formatTime(seconds)}</span><span class="label">Detik</span></div>
                </div>
            `;
        } else {
            timerHtml = `<div class="event-ended">Jadwal Telah Selesai!</div>`;
        }
        
        // Buat 2 TAMPILAN: Display (normal) dan Edit (form)
        // Kita akan menukar keduanya menggunakan CSS
        
        scheduleElement.innerHTML = `
            <div class="display-view">
                <button class="delete-btn" onclick="deleteSchedule(${schedule.id})">X</button>
                <button class="edit-btn" onclick="toggleEditView(${schedule.id})">✏️</button>
                <h3>${schedule.name}</h3>
                ${timerHtml}
            </div>
            
            <div class="edit-view">
                <input type="text" id="edit-name-${schedule.id}" value="${schedule.name}">
                <input type="datetime-local" id="edit-date-${schedule.id}" value="${schedule.date}">
                <div>
                    <button class="save-btn" onclick="saveEdit(${schedule.id})">Simpan Perubahan</button>
                    <button class="cancel-btn" onclick="toggleEditView(${schedule.id})">Batal</button>
                </div>
            </div>
        `;

        countdownContainer.appendChild(scheduleElement);
    });
}

// Fungsi helper untuk format waktu
function formatTime(time) {
    return time < 10 ? `0${time}` : time;
}


// --- Event Listeners dan Inisialisasi ---

// 1. Pasang listener di form (untuk Tambah)
scheduleForm.addEventListener('submit', addSchedule);

// 2. Tampilkan countdown saat halaman dimuat
displayAllCountdowns();

// 3. Set interval untuk mengupdate countdown setiap 1 detik
setInterval(displayAllCountdowns, 1000);