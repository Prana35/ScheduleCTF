// --- 1. INISIALISASI FIREBASE ---
// GANTI BAGIAN INI DENGAN KODE firebaseConfig DARI PROYEK ANDA
const firebaseConfig = {
    apiKey: "AIzaSyCnKA7R76gZKqfh_33Xs9RCa9twxuWrJS8",
    authDomain: "schedule-20208.firebaseapp.com",
    projectId: "schedule-20208",
    storageBucket: "schedule-20208.firebasestorage.app",
    messagingSenderId: "282033586009",
    appId: "1:282033586009:web:29a487119d34b253835648"
};

// Inisialisasi Firebase
const app = firebase.initializeApp(firebaseConfig);
// Hubungkan ke layanan Firestore
const db = firebase.firestore();
// Tentukan nama "koleksi" (seperti tabel) di database Anda
const schedulesCol = db.collection("schedules");


// --- 2. Inisialisasi Elemen DOM ---
const scheduleForm = document.getElementById('add-schedule-form');
const eventNameInput = document.getElementById('event-name');
const eventDateStartInput = document.getElementById('event-date-start');
const eventDateEndInput = document.getElementById('event-date-end');
const countdownContainer = document.getElementById('countdown-container');


// --- 3. Fungsi CRUD (Create, Read, Update, Delete) ---

/**
 * (CREATE) Menambahkan jadwal baru ke Firebase
 */
async function addSchedule(e) {
    e.preventDefault();
    const name = eventNameInput.value;
    const dateStart = eventDateStartInput.value;
    const dateEnd = eventDateEndInput.value;

    if (!name || !dateStart || !dateEnd) {
        alert("Semua kolom tidak boleh kosong!");
        return;
    }
    if (new Date(dateEnd) <= new Date(dateStart)) {
        alert("Waktu berakhir harus setelah waktu mulai!");
        return;
    }

    try {
        // Tambahkan dokumen baru ke koleksi 'schedules'
        await schedulesCol.add({
            name: name,
            dateStart: dateStart,
            dateEnd: dateEnd
        });
        scheduleForm.reset();
        renderAllSchedules(); // Muat ulang data
    } catch (error) {
        console.error("Error adding document: ", error);
        alert("Gagal menambahkan jadwal. Cek konsol.");
    }
}

/**
 * (READ) Menggambar semua jadwal dari Firebase ke HTML
 */
async function renderAllSchedules() {
    countdownContainer.innerHTML = '<p style="text-align: center; color: #555;">Memuat jadwal...</p>';
    
    try {
        // Ambil data dari Firebase, urutkan berdasarkan 'dateStart'
        const querySnapshot = await schedulesCol.orderBy("dateStart", "asc").get();
        
        countdownContainer.innerHTML = ''; // Kosongkan
        
        if (querySnapshot.empty) {
            countdownContainer.innerHTML = '<p style="text-align: center; color: #555;">Belum ada jadwal. Silakan tambahkan di atas!</p>';
            return;
        }

        querySnapshot.forEach(doc => {
            const schedule = doc.data(); // Data (nama, dateStart, dateEnd)
            const scheduleId = doc.id; // ID unik (misal: "aB3x...")
            
            // Buat elemen HTML
            const scheduleElement = document.createElement('div');
            scheduleElement.classList.add('schedule-item');
            scheduleElement.id = `schedule-item-${scheduleId}`;
            
            // Simpan tanggal di 'data-' attribute untuk live update
            scheduleElement.dataset.dateStart = schedule.dateStart;
            scheduleElement.dataset.dateEnd = schedule.dateEnd;

            const targetDateStartFormatted = formatTargetDate(schedule.dateStart);
            const targetDateEndFormatted = formatTargetDate(schedule.dateEnd);

            scheduleElement.innerHTML = `
                <div class="display-view">
                    <button class="delete-btn" onclick="deleteSchedule('${scheduleId}')">X</button>
                    <button class="edit-btn" onclick="toggleEditView('${scheduleId}')">✏️</button>
                    
                    <h3>${schedule.name}</h3>
                    
                    <p class="target-date-start"><b>Mulai:</b> ${targetDateStartFormatted}</p>
                    <p class="target-date-end"><b>Berakhir:</b> ${targetDateEndFormatted}</p>
                    
                    <p class="timer-label" id="timer-label-${scheduleId}"></p> 
                    <div class="timer" id="timer-${scheduleId}"></div>
                </div>

                <div class="edit-view">
                    <label>Nama Acara:</label>
                    <input type="text" id="edit-name-${scheduleId}" value="${schedule.name}">
                    <label>Waktu Mulai:</label>
                    <input type="datetime-local" id="edit-date-start-${scheduleId}" value="${schedule.dateStart}">
                    <label>Waktu Berakhir:</label>
                    <input type="datetime-local" id="edit-date-end-${scheduleId}" value="${schedule.dateEnd}">
                    <div>
                        <button class="save-btn" onclick="saveEdit('${scheduleId}')">Simpan</button>
                        <button class="cancel-btn" onclick="toggleEditView('${scheduleId}')">Batal</button>
                    </div>
                </div>
            `;
            countdownContainer.appendChild(scheduleElement);
        });
        
        updateLiveTimers(); // Panggil sekali setelah render
        
    } catch (error) {
        console.error("Error getting documents: ", error);
        countdownContainer.innerHTML = '<p style="text-align: center; color: red;">Gagal memuat data. Periksa koneksi atau konfigurasi Firebase.</p>';
    }
}

/**
 * (UPDATE) Menyimpan perubahan editan ke Firebase
 */
async function saveEdit(id) {
    const newName = document.getElementById(`edit-name-${id}`).value;
    const newDateStart = document.getElementById(`edit-date-start-${id}`).value;
    const newDateEnd = document.getElementById(`edit-date-end-${id}`).value;

    if (!newName || !newDateStart || !newDateEnd) {
        alert("Semua kolom tidak boleh kosong!");
        return;
    }
    if (new Date(newDateEnd) <= new Date(newDateStart)) {
        alert("Waktu berakhir harus setelah waktu mulai!");
        return;
    }

    try {
        // Ambil referensi dokumen berdasarkan ID-nya
        const docRef = schedulesCol.doc(id);
        // Update dokumen
        await docRef.update({
            name: newName,
            dateStart: newDateStart,
            dateEnd: newDateEnd
        });
        renderAllSchedules(); // Muat ulang
    } catch (error) {
        console.error("Error updating document: ", error);
        alert("Gagal menyimpan perubahan.");
    }
}

/**
 * (DELETE) Menghapus jadwal dari Firebase
 */
async function deleteSchedule(id) {
    if (!confirm("Apakah Anda yakin ingin menghapus jadwal ini?")) {
        return;
    }
    try {
        await schedulesCol.doc(id).delete();
        renderAllSchedules(); // Muat ulang
    } catch (error) {
        console.error("Error removing document: ", error);
        alert("Gagal menghapus jadwal.");
    }
}

// --- 4. Fungsi Live Update Timer ---

/**
 * (LIVE) Hanya mengupdate teks timer setiap detik
 * Fungsi ini membaca 'data-' atribut dari HTML, TIDAK perlu ke database
 */
function updateLiveTimers() {
    const now = new Date().getTime();
    
    // Ambil semua item jadwal yang sedang tampil
    document.querySelectorAll('.schedule-item').forEach(item => {
        // Cek apakah sedang dalam mode edit, jika ya, lewati
        if (item.classList.contains('is-editing')) return;
        
        const scheduleId = item.id.replace('schedule-item-', '');
        const timerLabel = document.getElementById(`timer-label-${scheduleId}`);
        const timerDisplay = document.getElementById(`timer-${scheduleId}`);
        
        if (!timerLabel || !timerDisplay) return; // Lewati jika elemen tidak ada
        
        // Ambil tanggal dari data-* atribut
        const eventStartDate = new Date(item.dataset.dateStart).getTime();
        const eventEndDate = new Date(item.dataset.dateEnd).getTime();

        let difference = 0;
        let label = "";
        let showTimer = true;

        if (now < eventStartDate) {
            difference = eventStartDate - now;
            label = "DIMULAI DALAM:";
        } else if (now >= eventStartDate && now < eventEndDate) {
            difference = eventEndDate - now;
            label = "BERAKHIR DALAM:";
        } else {
            label = "";
            showTimer = false;
        }

        timerLabel.innerHTML = label;

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
            timerDisplay.innerHTML = `<div class="event-ended">Jadwal Telah Selesai!</div>`;
        }
    });
}

// --- 5. Fungsi Helper & Event Listeners ---

// Fungsi helper (tidak perlu async)
function toggleEditView(id) {
    const scheduleItem = document.getElementById(`schedule-item-${id}`);
    scheduleItem.classList.toggle('is-editing');
}

function formatTargetDate(dateString) {
    if (!dateString) return "Tanggal tidak valid"; 
    const date = new Date(dateString);
    const options = {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    };
    return date.toLocaleDateString('id-ID', options);
}

function formatTime(time) {
    return time < 10 ? `0${time}` : time;
}

// Pasang Event Listeners global
// (Kita tidak bisa memanggil fungsi async langsung di HTML, jadi kita pasang listener di sini)
window.deleteSchedule = deleteSchedule;
window.toggleEditView = toggleEditView;
window.saveEdit = saveEdit;

// Jalankan saat halaman dimuat
scheduleForm.addEventListener('submit', addSchedule);
document.addEventListener('DOMContentLoaded', renderAllSchedules);
setInterval(updateLiveTimers, 1000);