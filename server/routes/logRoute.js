import express from 'express'
import patientModel from '../models/patientModel.js'

const router = express.Router();

// Get all logs for a patient
router.get('/:patientId', async (req, res) => {
  try {
    const patient = await patientModel.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    res.json(patient.logs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Add log to patient
router.post('/:patientId', async (req, res) => {
  try {
    console.log('patientId:', req.params.patientId);
    console.log('body:', req.body);
    const patient = await patientModel.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    patient.logs.push(req.body);
    await patient.save();
    res.json({ success: true });
  } catch (e) {
    console.log('error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Delete a log
router.delete('/:patientId/:logId', async (req, res) => {
  try {
    const patient = await patientModel.findById(req.params.patientId);
    if (!patient) return res.status(404).json({ error: 'Patient not found' });
    patient.logs = patient.logs.filter(log => log._id.toString() !== req.params.logId);
    await patient.save();
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;