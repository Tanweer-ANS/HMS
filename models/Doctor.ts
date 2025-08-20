import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true,
  },
  firstName: {
    type: String,
    required: true,
  },
  lastName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  specialization: {
    type: String,
    required: true,
  },
  experience: {
    type: Number,
    required: true,
  },
  qualification: {
    type: String,
    required: true,
  },
  contactNumber: {
    type: String,
    required: true,
  },
  consultationFee: {
    type: Number,
    required: true,
  },
  availableSlots: [{
    day: String,
    startTime: String,
    endTime: String,
  }],
  biography: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    default: 0,
  },
  totalPatients: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Doctor || mongoose.model('Doctor', DoctorSchema);