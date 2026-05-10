const mongoose = require('mongoose');

// Skema untuk data log interaksi masif
const studentVleSchema = new mongoose.Schema({
    code_module: { type: String, required: true },
    code_presentation: { type: String, required: true },
    id_student: { type: Number, required: true, index: true },
    id_site: { type: Number, required: true },
    date: { type: Number, required: true },
    sum_click: { type: Number, required: true }
});

// Compound Index untuk skenario query analitik
studentVleSchema.index({ id_student: 1, code_module: 1, code_presentation: 1 });

const VleMongo = mongoose.model('StudentVle', studentVleSchema);

module.exports = { VleMongo };