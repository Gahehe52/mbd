const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function importMasterData() {
    try {
        console.log("⏳ Menghubungkan ke database PostgreSQL...");
        await prisma.$connect();
        console.log("✅ Koneksi database berhasil!");

        // ==========================================
        // 1. IMPORT COURSES.CSV
        // ==========================================
        console.log("\n1. Membaca courses.csv...");
        if (!fs.existsSync('courses.csv')) throw new Error("File courses.csv tidak ditemukan di folder ini!");

        const courses = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream('courses.csv')
                .on('error', error => reject(error))
                .pipe(csv({
                    mapHeaders: ({ header }) => header.replace(/"/g, '').trim(),
                    mapValues: ({ value }) => value.replace(/"/g, '').trim()
                }))
                .on('data', row => {
                    if (row.code_module && row.code_presentation) {
                        courses.push({
                            code_module: row.code_module,
                            code_presentation: row.code_presentation,
                            module_presentation_length: parseInt(row.module_presentation_length) || 0
                        });
                    }
                })
                .on('end', resolve);
        });

        console.log(`   Menyimpan ${courses.length} baris data mata kuliah ke database...`);
        await prisma.courses.createMany({ data: courses, skipDuplicates: true });
        console.log("✅ courses.csv berhasil diimpor!");

        // ==========================================
        // 2. IMPORT STUDENTINFO.CSV
        // ==========================================
        console.log("\n2. Membaca studentInfo.csv...");
        if (!fs.existsSync('studentInfo.csv')) throw new Error("File studentInfo.csv tidak ditemukan di folder ini!");

        const students = [];
        await new Promise((resolve, reject) => {
            fs.createReadStream('studentInfo.csv')
                .on('error', error => reject(error))
                .pipe(csv({
                    mapHeaders: ({ header }) => header.replace(/"/g, '').trim(),
                    mapValues: ({ value }) => value.replace(/"/g, '').trim()
                }))
                .on('data', row => {
                    if (row.id_student) {
                        students.push({
                            id_student: parseInt(row.id_student),
                            code_module: row.code_module,
                            code_presentation: row.code_presentation,
                            gender: row.gender,
                            region: row.region,
                            highest_education: row.highest_education,
                            imd_band: (!row.imd_band || row.imd_band === '?') ? null : row.imd_band,
                            age_band: row.age_band,
                            num_of_prev_attempts: parseInt(row.num_of_prev_attempts) || 0,
                            studied_credits: parseInt(row.studied_credits) || 0,
                            disability: row.disability,
                            final_result: row.final_result
                        });
                    }
                })
                .on('end', resolve);
        });

        console.log(`   Menyimpan ${students.length} baris profil mahasiswa ke database...`);
        await prisma.studentInfo.createMany({ data: students, skipDuplicates: true });
        console.log("✅ studentInfo.csv berhasil diimpor!");

    } catch (error) {
        console.error("\n❌ TERJADI KESALAHAN:");
        console.error(error.message);
    } finally {
        await prisma.$disconnect();
        console.log("\nSelesai. Koneksi database ditutup.");
    }
}

importMasterData();