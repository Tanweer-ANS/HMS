import { NextResponse } from 'next/server';
import { useAuth } from '@clerk/nextjs';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';

export async function GET() {
  try {
    const { userId } = useAuth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const patient = await Patient.findOne({ clerkId: userId });
    if (!patient) {
      return NextResponse.json({ appointments: [] });
    }

    const appointments = await Appointment.find({ patientId: patient._id })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ appointmentDate: -1 });

    const formattedAppointments = appointments.map(appointment => ({
      ...appointment.toObject(),
      doctor: appointment.doctorId
    }));

    return NextResponse.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Error fetching patient appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}