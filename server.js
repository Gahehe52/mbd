const express = require('express');
const { PrismaClient } = require('@prisma/client');
const mongoose = require('mongoose');
const { VleMongo } = require('./mongoSchema');

const app = express();
const prisma = new PrismaClient();

// Gunakan 127.0.0.1 agar kebal dari masalah localhost Windows
mongoose.connect('mongodb://127.0.0.1:27017/oulad_polyglot');

// =========================================================
// 1. BASELINE MONOLITIK (100% PostgreSQL)
// Menguji RDBMS dalam mencari profil + Agregasi 10.6 Juta data
// =========================================================
app.get('/api/baseline/:id', async (req, res) => {
    const studentId = parseInt(req.params.id);
    try {
        // 1. Tarik profil mahasiswa
        const student = await prisma.studentInfo.findFirst({ 
            where: { id_student: studentId } 
        });
        if (!student) return res.status(404).send("Mahasiswa tidak ditemukan");

        // 2. Suruh PostgreSQL melakukan kalkulasi SUM()
        const vleData = await prisma.studentVle.aggregate({
            where: { id_student: studentId },
            _sum: { sum_click: true }
        });

        res.json({ region: student.region, total_clicks: vleData._sum.sum_click || 0 });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// =========================================================
// 2. POLYGLOT PERSISTENCE (PostgreSQL + MongoDB)
// Profil di RDBMS, Agregasi berat didelegasikan ke NoSQL
// =========================================================
app.get('/api/polyglot/:id', async (req, res) => {
    const studentId = parseInt(req.params.id);
    try {
        // 1. Tarik profil mahasiswa dari RDBMS
        const student = await prisma.studentInfo.findFirst({ 
            where: { id_student: studentId } 
        });
        if (!student) return res.status(404).send("Mahasiswa tidak ditemukan");

        // 2. Suruh MongoDB melakukan kalkulasi $sum
        const mongoData = await VleMongo.aggregate([
            { $match: { id_student: studentId } },
            { $group: { _id: null, total_clicks: { $sum: "$sum_click" } } }
        ]);

        const totalClicks = mongoData.length > 0 ? mongoData[0].total_clicks : 0;
        res.json({ region: student.region, total_clicks: totalClicks });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// =========================================================
// 3. SKENARIO ANALITIK BERAT (Heavy Aggregation)
// Mensimulasikan dashboard rekapitulasi data raksasa
// =========================================================

// Baseline Heavy (PostgreSQL memindai jutaan baris sendirian)
app.get('/api/baseline-heavy/:module/:presentation', async (req, res) => {
    const { module, presentation } = req.params;
    try {
        const vleData = await prisma.studentVle.aggregate({
            where: { code_module: module, code_presentation: presentation },
            _sum: { sum_click: true }
        });
        res.json({ module, presentation, total_clicks: vleData._sum.sum_click || 0 });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

// Polyglot Heavy (MongoDB mengambil alih beban komputasi Big Data)
app.get('/api/polyglot-heavy/:module/:presentation', async (req, res) => {
    const { module, presentation } = req.params;
    try {
        const mongoData = await VleMongo.aggregate([
            { $match: { code_module: module, code_presentation: presentation } },
            { $group: { _id: null, total_clicks: { $sum: "$sum_click" } } }
        ]);
        const totalClicks = mongoData.length > 0 ? mongoData[0].total_clicks : 0;
        res.json({ module, presentation, total_clicks: totalClicks });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => console.log('Server API berjalan di port 3000...'));