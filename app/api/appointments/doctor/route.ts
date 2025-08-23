import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import Patient from '@/models/Patient';
import Doctor from '@/models/Doctor';

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    const doctor = await Doctor.findOne({ clerkId: userId });
    if (!doctor) {
      return NextResponse.json({ appointments: [] });
    }

    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('patientId')
      .sort({ appointmentDate: -1 });

    const formattedAppointments = appointments.map(appointment => ({
      ...appointment.toObject({getter: true, virtuals: true}),
      patient: appointment.patientId
    }));

    return NextResponse.json({ appointments: formattedAppointments });
  } catch (error) {
    console.error('Error in API routes:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}