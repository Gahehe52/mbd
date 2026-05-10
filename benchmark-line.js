const autocannon = require('autocannon');
const fs = require('fs');
const { exec } = require('child_process');

function runTest(name, url, connections, duration) {
    return new Promise((resolve, reject) => {
        console.log(`\n⏳ Menjalankan: ${name}...`);
        const instance = autocannon({ url, connections, duration }, (err, result) => {
            if (err) reject(err);
            else {
                console.log(`✅ Selesai! (Req/Sec: ${result.requests.average})`);
                resolve(result);
            }
        });
        autocannon.track(instance, { renderProgressBar: true });
    });
}

async function startLineBenchmark() {
    console.log("==================================================");
    console.log("📈 MEMULAI BENCHMARK SKALABILITAS (LINE CHART)");
    console.log("==================================================");

    // Pengaturan Tes
    const connections = 25;
    const duration = 10; // 10 detik per tes agar tidak terlalu lama

    try {
        // 1. DATA KECIL (Point Query)
        const monoSmall = await runTest('Mono (Data Kecil)', 'http://localhost:3000/api/baseline/11391', connections, duration);
        const polySmall = await runTest('Poly (Data Kecil)', 'http://localhost:3000/api/polyglot/11391', connections, duration);

        // 2. DATA MENENGAH (Scan Modul AAA)
        const monoMed = await runTest('Mono (Data Menengah)', 'http://localhost:3000/api/baseline-heavy/AAA/2013J', connections, duration);
        const polyMed = await runTest('Poly (Data Menengah)', 'http://localhost:3000/api/polyglot-heavy/AAA/2013J', connections, duration);

        // 3. DATA BESAR (Scan Modul FFF)
        const monoLarge = await runTest('Mono (Data Besar)', 'http://localhost:3000/api/baseline-heavy/FFF/2013J', connections, duration);
        const polyLarge = await runTest('Poly (Data Besar)', 'http://localhost:3000/api/polyglot-heavy/FFF/2013J', connections, duration);

        console.log("\n📊 Merender Line Chart...");

        // HTML & Chart.js Template
        const htmlContent = `
        <!DOCTYPE html>
        <html lang="id">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Skalabilitas Polyglot vs Monolitik</title>
            <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
            <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: center; background: #fdfdfd; padding: 20px; }
                .container { display: flex; flex-direction: column; align-items: center; gap: 40px; margin-top: 20px; }
                .chart-box { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); width: 80%; max-width: 900px; }
            </style>
        </head>
        <body>
            <h1>📈 Tren Performa Berdasarkan Volume Data</h1>
            <p>Bukti Crossover Point: Kapan Polyglot Mengalahkan Monolitik?</p>
            
            <div class="container">
                <div class="chart-box">
                    <h2>Kapasitas Throughput (Request / Detik)</h2>
                    <p style="color: gray; font-size: 14px;">(Garis yang lebih <b>TINGGI</b> lebih baik)</p>
                    <canvas id="throughputLineChart"></canvas>
                </div>

                <div class="chart-box">
                    <h2>Waktu Respons Latency (Milidetik)</h2>
                    <p style="color: gray; font-size: 14px;">(Garis yang lebih <b>RENDAH</b> lebih baik)</p>
                    <canvas id="latencyLineChart"></canvas>
                </div>
            </div>

            <script>
                const dataLabels = ['Skala Kecil (1 Mahasiswa)', 'Skala Menengah (Modul AAA)', 'Skala Raksasa (Modul FFF)'];
                
                // --- SETUP CHART THROUGHPUT ---
                new Chart(document.getElementById('throughputLineChart'), {
                    type: 'line',
                    data: {
                        labels: dataLabels,
                        datasets: [
                            {
                                label: 'Monolitik (PostgreSQL)',
                                data: [${monoSmall.requests.average}, ${monoMed.requests.average}, ${monoLarge.requests.average}],
                                borderColor: '#e74c3c', // Merah
                                backgroundColor: 'rgba(231, 76, 60, 0.2)',
                                borderWidth: 3,
                                tension: 0.3,
                                pointRadius: 6
                            },
                            {
                                label: 'Polyglot (PG + MongoDB)',
                                data: [${polySmall.requests.average}, ${polyMed.requests.average}, ${polyLarge.requests.average}],
                                borderColor: '#2ecc71', // Hijau
                                backgroundColor: 'rgba(46, 204, 113, 0.2)',
                                borderWidth: 3,
                                tension: 0.3,
                                pointRadius: 6
                            }
                        ]
                    },
                    options: { responsive: true, scales: { y: { beginAtZero: true } } }
                });

                // --- SETUP CHART LATENCY ---
                new Chart(document.getElementById('latencyLineChart'), {
                    type: 'line',
                    data: {
                        labels: dataLabels,
                        datasets: [
                            {
                                label: 'Monolitik (PostgreSQL)',
                                data: [${monoSmall.latency.average}, ${monoMed.latency.average}, ${monoLarge.latency.average}],
                                borderColor: '#e74c3c',
                                borderDash: [5, 5], // Garis putus-putus untuk Latency Mono
                                borderWidth: 3,
                                tension: 0.3,
                                pointRadius: 6
                            },
                            {
                                label: 'Polyglot (PG + MongoDB)',
                                data: [${polySmall.latency.average}, ${polyMed.latency.average}, ${polyLarge.latency.average}],
                                borderColor: '#2ecc71',
                                borderDash: [5, 5], // Garis putus-putus untuk Latency Poly
                                borderWidth: 3,
                                tension: 0.3,
                                pointRadius: 6
                            }
                        ]
                    },
                    options: { responsive: true, scales: { y: { beginAtZero: true } } }
                });
            </script>
        </body>
        </html>
        `;

        const fileName = 'line-chart-hasil.html';
        fs.writeFileSync(fileName, htmlContent);

        const openCommand = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
        exec(`${openCommand} ${fileName}`);

        console.log(`🎉 Berhasil! Line Chart telah dibuka di browser Anda.`);

    } catch (error) {
        console.error("Terjadi kesalahan:", error);
    }
}

startLineBenchmark();