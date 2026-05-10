const autocannon = require('autocannon');
const fs = require('fs');
const { exec } = require('child_process');

// Fungsi pembungkus agar Autocannon bisa berjalan berurutan (Async/Await)
function runTest(name, url, connections, duration) {
    return new Promise((resolve, reject) => {
        console.log(`\n⏳ Menjalankan tes: ${name}... (${duration} detik)`);
        const instance = autocannon({
            url,
            connections,
            duration,
        }, (err, result) => {
            if (err) reject(err);
            else {
                console.log(`✅ ${name} selesai!`);
                resolve(result);
            }
        });

        // Menampilkan progress bar di terminal
        autocannon.track(instance, { renderProgressBar: true });
    });
}

async function startBenchmark() {
    console.log("==================================================");
    console.log("🚀 MEMULAI OTOMATISASI BENCHMARK OULAD (HEAVY)");
    console.log("==================================================");

    try {
        // 1. Jalankan tes Monolitik
        const resMono = await runTest(
            'Baseline (PostgreSQL)', 
            'http://localhost:3000/api/baseline-heavy/FFF/2013J', 
            25, // koneksi
            15  // detik
        );

        // 2. Jalankan tes Polyglot
        const resPoly = await runTest(
            'Polyglot (MongoDB)', 
            'http://localhost:3000/api/polyglot-heavy/FFF/2013J', 
            25, 
            15
        );

        console.log("\n📊 Mengumpulkan data dan merender grafik...");

        // Ambil rata-rata (average) dari hasil tes
        const monoReq = resMono.requests.average || 0;
        const polyReq = resPoly.requests.average || 0;
        const monoLat = resMono.latency.average || 0;
        const polyLat = resPoly.latency.average || 0;

        // 3. Bangun template HTML menggunakan data hasil tes asli
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hasil Benchmark Otomatis</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: sans-serif; text-align: center; background: #f8f9fa; padding: 20px; }
                .container { display: flex; justify-content: center; gap: 30px; margin-top: 30px; flex-wrap: wrap; }
                .chart-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); width: 45%; min-width: 400px; }
            </style>
        </head>
        <body>
            <h1>🚀 Hasil Pengujian: Heavy Aggregation (OULAD)</h1>
            <p>25 Koneksi Bersamaan | Durasi: 15 Detik per Arsitektur</p>
            
            <div class="container">
                <div class="chart-box">
                    <h3>Throughput (Req/Sec)</h3>
                    <p style="color: gray; font-size: 14px;">Semakin tinggi semakin baik</p>
                    <canvas id="throughputChart"></canvas>
                </div>
                <div class="chart-box">
                    <h3>Latency (ms)</h3>
                    <p style="color: gray; font-size: 14px;">Semakin rendah semakin responsif</p>
                    <canvas id="latencyChart"></canvas>
                </div>
            </div>

            <script>
                const labels = ['Skenario Analitik Berat (Massive Scan)'];
                
                // Chart Throughput
                new Chart(document.getElementById('throughputChart'), {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: 'PostgreSQL', data: [${monoReq}], backgroundColor: '#3498db' },
                            { label: 'Polyglot', data: [${polyReq}], backgroundColor: '#2ecc71' }
                        ]
                    }
                });

                // Chart Latency
                new Chart(document.getElementById('latencyChart'), {
                    type: 'bar',
                    data: {
                        labels: labels,
                        datasets: [
                            { label: 'PostgreSQL', data: [${monoLat}], backgroundColor: '#e74c3c' },
                            { label: 'Polyglot', data: [${polyLat}], backgroundColor: '#f1c40f' }
                        ]
                    }
                });
            </script>
        </body>
        </html>
        `;

        // 4. Simpan ke file HTML
        const fileName = 'hasil-benchmark.html';
        fs.writeFileSync(fileName, htmlContent);

        // 5. Buka file HTML secara otomatis di browser bawaan OS
        const openCommand = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
        exec(`${openCommand} ${fileName}`);

        console.log(`🎉 Berhasil! Grafik telah dibuka di browser Anda.`);

    } catch (error) {
        console.error("Terjadi kesalahan saat benchmark:", error);
    }
}

startBenchmark();