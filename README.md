## 🚀 Fitur Utama
- **Dual-Database Integration**: Menggunakan PostgreSQL untuk data relasional dan MongoDB untuk data log aktivitas masif (10.6 Juta Baris).
- **Automated Benchmarking**: Skrip otomatis menggunakan Autocannon untuk menguji *throughput* dan *latency*.
- **Hardware Profiling**: Jupyter Notebook terintegrasi untuk merekam lonjakan CPU & RAM secara *real-time* dari Docker containers.
- **Advanced Indexing**: Implementasi *Left-Prefix Rule* untuk pengujian yang adil (*Fair Evaluation*).

---

## 📋 Prasyarat Sistem
Sebelum memulai, pastikan perangkat Anda telah terinstall:
- [Node.js](https://nodejs.org/) (v18 atau lebih baru)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Python](https://www.python.org/) (v3.10+ untuk Jupyter Notebook)
- [VS Code](https://code.visualstudio.com/) (dengan ekstensi Jupyter terpasang)

---

## 🛠️ Langkah Instalasi

### 1. Kloning Repositori
```bash
git clone [https://github.com/username/mbd.git](https://github.com/username/mbd.git)
cd mbd

```

### 2. Instalasi Dependency

Instal library Node.js dan Python yang dibutuhkan:

```bash
# Install Node.js dependencies
npm install

# Install Python libraries untuk visualisasi
pip install matplotlib pandas

```

---

## 🏗️ Persiapan Infrastruktur

### 1. Menjalankan Database (Docker)

Gunakan Docker Compose untuk menjalankan PostgreSQL dan MongoDB secara instan:

```bash
docker-compose up -d

```

### 2. Sinkronisasi Skema Database (Prisma)

Generate client dan dorong skema ke PostgreSQL:

```bash
npx prisma db push

```

---

## 📥 Import Dataset OULAD

1. Unduh dataset OULAD dari [situs resmi](https://www.google.com/search?q=https://analyze.kmi.open.ac.uk/open_dataset).
2. Letakkan file `.csv` (terutama `studentVle.csv`, `courses.csv`, dan `studentInfo.csv`) di root folder proyek ini.
3. Jalankan skrip import (Peringatan: Proses ini memproses 10.6 juta baris, mungkin memakan waktu beberapa menit):

```bash
# Import data master (courses & student profile)
node import-master.js

# Import data log aktivitas masif (studentVle)
node import-oulad.js

```

---

## 🏃 Menjalankan Aplikasi

Nyalakan server API sebelum melakukan pengujian:

```bash
node server.js

```

Server akan berjalan di `http://localhost:3000`.

---

## 📊 Cara Melakukan Pengujian (Benchmark)

### Skenario 1: Pengujian CLI (Autocannon)

Anda dapat melakukan *stress test* manual melalui terminal:

```bash
# Test Baseline (PostgreSQL)
npx autocannon -c 25 -d 15 http://localhost:3000/api/baseline-heavy/FFF/2013J

# Test Polyglot Persistence (MongoDB)
npx autocannon -c 25 -d 15 http://localhost:3000/api/polyglot-heavy/FFF/2013J

```

### Skenario 2: Visualisasi & Profiling CPU (Jupyter Notebook)

Untuk mendapatkan grafik perbandingan *head-to-head* dan analisis penggunaan CPU:

1. Buka file `benchmark-visual.ipynb` di VS Code.
2. Pilih **Kernel Python** yang sesuai di pojok kanan atas.
3. Jalankan sel kode terakhir untuk memulai pengujian otomatis.
4. Skrip akan secara otomatis:
* Menembak endpoint Baseline & Polyglot.
* Menyadap statistik Docker (`docker stats`).
* Menghasilkan grafik perbandingan *Throughput*, *Latency*, dan *CPU Usage*.



---

## 📁 Struktur Folder

* `/prisma`: Definisi skema PostgreSQL.
* `server.js`: API Entry point dengan endpoint pengujian.
* `mongoSchema.js`: Definisi skema dan indexing MongoDB.
* `import-*.js`: Skrip ETL untuk memproses CSV OULAD.
* `benchmark-visual.ipynb`: Analisis data dan profiling hardware.

---

## 📝 Catatan Penting

* **Hardware Monitoring**: Fitur monitoring CPU di Jupyter Notebook bergantung pada perintah `docker stats`. Pastikan Docker Desktop dalam keadaan aktif saat menjalankan notebook.
* **Reset Data**: Jika ingin mengosongkan database, gunakan `docker-compose down -v` lalu ulangi langkah persiapan infrastruktur.

