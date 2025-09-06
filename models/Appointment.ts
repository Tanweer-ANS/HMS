import mongoose from 'mongoose';
import Doctor from './Doctor';
import Patient from './Patient';

const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Patient,
    required: true,
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Doctor,
    required: true,
  },
  appointmentDate: {
    type: Date,
    required: true,
  },
  appointmentTime: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['Scheduled', 'Confirmed', 'Completed', 'Cancelled', 'No Show'],
    default: 'Scheduled',
  },
  reason: {
    type: String,
    required: true,
  },
  symptoms: [String],
  notes: {
    type: String,
    default: '',
  },
  diagnosis: {
    type: String,
    default: '',
  },
  prescription: [{
    medication: String,
    dosage: String,
    frequency: String,
    duration: String,
  }],
  consultationFee: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Refunded'],
    default: 'Pending',
  },
  paymentIntentId: {
    type: String,
    default: null,
  },
  paymentMethod: {
    type: String,
    enum: ['razorpay'],
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema)