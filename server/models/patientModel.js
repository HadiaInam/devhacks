import mongoose from 'mongoose'

const logSchema = new mongoose.Schema({
    date: { type: Date, default: Date.now },
    intensity: Number,
    title: String,
    summary: String,
    postAppointmentMedications: [String],
    postAppointmentPrecautions: [String],
    followUp: String,
    symptoms: [String],
    appointmentType: String,
    questionsForDoctor: [String],
  });
  
  const patientSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    gender: { type: String, default: 'Not Selected' },
    dob: { type: String, default: 'Not Selected' },
    phone: { type: String, default: '000000000' },
    logs: [logSchema],
  });

const patientModel = mongoose.models.patient || mongoose.model('patient', patientSchema)
export default patientModel