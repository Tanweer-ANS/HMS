import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';
import Appointment from '@/models/Appointment';

export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();
    const { doctorId, appointmentDate, appointmentTime, reason, consultationFee } = data;

    // Find the patient by clerkId
    const patient = await Patient.findOne({ clerkId: userId });
    if (!patient) {
      // Avoid 404 to prevent noisy console errors on the client
      return NextResponse.json({ success: false, error: 'Please complete your patient profile before booking.' });
    }

    // Verify the doctor exists
    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Check if the appointment slot is available
    const existingAppointment = await Appointment.findOne({
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: { $in: ['Scheduled', 'Confirmed'] }
    });

    if (existingAppointment) {
      return NextResponse.json({ error: 'This time slot is already booked' }, { status: 409 });
    }

    // Create the appointment
    const appointment = new Appointment({
      patientId: patient._id,
      doctorId,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      reason,
      consultationFee: consultationFee || doctor.consultationFee,
      status: 'Scheduled'
    });

    await appointment.save();

    // Populate doctor details for response
    await appointment.populate('doctorId', 'firstName lastName specialization');

    return NextResponse.json({ 
      success: true, 
      appointment,
      message: 'Appointment booked successfully' 
    });
  } catch (error) {
    console.error('Error booking appointment:', error);
    return NextResponse.json({ error: 'Failed to book appointment' }, { status: 500 });
  }
}
