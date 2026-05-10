const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');
const mongoose = require('mongoose');
const { VleMongo } = require('./mongoSchema');

const prisma = new PrismaClient();
mongoose.connect('mongodb://localhost:27017/oulad_polyglot');

// Fungsi pembantu untuk mengatasi format '?' pada dataset OULAD
const parseNull = (val) => (!val || val === '?' ? null : val);
const parseIntNull = (val) => (parseNull(val) !== null ? parseInt(val, 10) : null);

async function importStudentVle() {
    console.log("Mulai membaca studentVle.csv...");
    
    let batchPg = [];
    let batchMongo = [];
    let count = 0;
    const BATCH_SIZE = 10000; // Simpan ke DB setiap 10.000 baris

    const stream = fs.createReadStream('studentVle.csv')
        .pipe(csv({
            // Menangani anomali header jika file CSV di-truncate manual dari Excel
            mapHeaders: ({ header }) => header.replace(/"/g, '').trim(),
            mapValues: ({ value }) => value.replace(/"/g, '').trim()
        }))
        .on('data', async (row) => {
            const dataRow = {
                code_module: row.code_module,
                code_presentation: row.code_presentation,
                id_student: parseIntNull(row.id_student),
                id_site: parseIntNull(row.id_site),
                date: parseIntNull(row.date),
                sum_click: parseIntNull(row.sum_click)
            };

            // Pastikan data valid sebelum di-push
            if(dataRow.id_student) {
                batchPg.push(dataRow);
                batchMongo.push(dataRow);
                count++;
            }

            if (batchPg.length >= BATCH_SIZE) {
                stream.pause(); // Jeda pembacaan CSV agar RAM tidak penuh
                
                try {
                    // Insert massal ke PostgreSQL (Baseline)
                    await prisma.studentVle.createMany({ data: batchPg });
                    
                    // Insert massal ke MongoDB (Polyglot)
                    await VleMongo.insertMany(batchMongo);
                    
                    console.log(`Berhasil memproses ${count.toLocaleString()} baris...`);
                } catch (err) {
                    console.error("Gagal insert batch:", err.message);
                }

                batchPg = [];
                batchMongo = [];
                stream.resume(); // Lanjutkan pembacaan CSV
            }
        })
        .on('end', async () => {
            // Insert sisa data yang kurang dari BATCH_SIZE
            if (batchPg.length > 0) {
                await prisma.studentVle.createMany({ data: batchPg });
                await VleMongo.insertMany(batchMongo);
            }
            console.log(`✅ SELESAI! Total log aktivitas ter-import: ${count.toLocaleString()}`);
            process.exit();
        });
}

// Menjalankan Skrip
importStudentVle();