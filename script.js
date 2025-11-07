// --- Inisialisasi Elemen dan Data ---

const scheduleForm = document.getElementById('add-schedule-form');
const eventNameInput = document.getElementById('event-name');
const eventDateInput = document.getElementById('event-date');
const countdownContainer = document.getElementById('countdown-container');

// Memuat jadwal dari localStorage atau menggunakan array kosong jika tidak ada
let schedules = loadSchedules();

// --- Fungsi-Fungsi Utama ---

/**
 * Memuat jadwal dari localStorage
 */
function loadSchedules() {
    const schedulesJSON = localStorage.getItem('mySchedules');
    // Jika ada data, parse JSON-nya. Jika tidak, kembalikan array kosong.
    return schedulesJSON ? JSON.parse(schedulesJSON) : [];
}

/**
 * Menyimpan array 'schedules' saat ini ke localStorage
 * @param {Array} schedulesToSave - Array jadwal yang ingin disimpan
 */
function saveSchedules(schedulesToSave) {
    localStorage.setItem('mySchedules', JSON.stringify(schedulesToSave));
}

/**
 * Menambahkan jadwal baru
 * @param {Event} e - Event object dari form submission
 */
function addSchedule(e) {
    e.preventDefault(); // Mencegah halaman refresh saat form disubmit

    const name = eventNameInput.value;
    const date = eventDateInput.value;

    // Validasi sederhana
    if (!name || !date) {
        alert("Nama acara dan tanggal tidak boleh kosong!");
        return;
    }

    const newSchedule = {
        id: new Date().getTime(), // ID unik berdasarkan timestamp
        name: name,
        date: date
    };

    // Tambahkan jadwal baru ke array
    schedules.push(newSchedule);

    // Simpan array yang sudah diupdate ke localStorage
    saveSchedules(schedules);

    // Reset form
    scheduleForm.reset();

    // Tampilkan ulang semua countdown
    displayAllCountdowns();
}

/**
 * Menghapus jadwal berdasarkan ID-nya
 * @param {number} id - ID unik dari jadwal yang akan dihapus
 */
function deleteSchedule(id) {
    // Filter array, sisakan hanya jadwal yang ID-nya TIDAK SAMA dengan id yang mau dihapus
    schedules = schedules.filter(schedule => schedule.id !== id);

    // Simpan array baru ke localStorage
    saveSchedules(schedules);

    // Tampilkan ulang semua countdown
    displayAllCountdowns();
}

/**
 * Fungsi utama untuk menampilkan semua countdown
 * Ini akan berjalan setiap detik untuk mengupdate timer
 */
function displayAllCountdowns() {
    const now = new Date().getTime();
    countdownContainer.innerHTML = ''; // Kosongkan kontainer sebelum mengisi ulang

    if (schedules.length === 0) {
        countdownContainer.innerHTML = '<p style="text-align: center; color: #555;">Belum ada jadwal. Silakan tambahkan di atas!</p>';
        return;
    }

    // Urutkan jadwal berdasarkan tanggal (yang paling dekat tampil di atas)
    schedules.sort((a, b) => new Date(a.date) - new Date(b.date));

    schedules.forEach(schedule => {
        const eventDate = new Date(schedule.date).getTime();
        const difference = eventDate - now;

        // Buat elemen HTML untuk setiap jadwal
        const scheduleElement = document.createElement('div');
        scheduleElement.classList.add('schedule-item');

        let timerHtml;

        if (difference > 0) {
            // Perhitungan waktu
            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((difference % (1000 * 60)) / 1000);

            timerHtml = `
                <div class="timer">
                    <div class="time-box">
                        <span>${days}</span>
                        <span class="label">Hari</span>
                    </div>
                    <div class="time-box">
                        <span>${formatTime(hours)}</span>
                        <span class="label">Jam</span>
                    </div>
                    <div class="time-box">
                        <span>${formatTime(minutes)}</span>
                        <span class="label">Menit</span>
                    </div>
                    <div class="time-box">
                        <span>${formatTime(seconds)}</span>
                        <span class="label">Detik</span>
                    </div>
                </div>
            `;
        } else {
            // Jika waktu sudah lewat
            timerHtml = `<div class="event-ended">Jadwal Telah Selesai!</div>`;
        }

        // Gabungkan semua HTML
        scheduleElement.innerHTML = `
            <button class="delete-btn" onclick="deleteSchedule(${schedule.id})">X</button>
            <h3>${schedule.name}</h3>
            ${timerHtml}
        `;

        // Tambahkan elemen jadwal ini ke kontainer
        countdownContainer.appendChild(scheduleElement);
    });
}

// Fungsi untuk menambahkan '0' di depan angka (helper)
function formatTime(time) {
    return time < 10 ? `0${time}` : time;
}


// --- Event Listeners dan Inisialisasi ---

// 1. Pasang listener di form
scheduleForm.addEventListener('submit', addSchedule);

// 2. Tampilkan countdown saat halaman pertama kali dimuat
displayAllCountdowns();

// 3. Set interval untuk mengupdate countdown setiap 1 detik
setInterval(displayAllCountdowns, 1000);