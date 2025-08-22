// app/api/appointments/doctor/route.ts

import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
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
      ...appointment.toObject({ getters: true, virtuals: true }),
      patient: appointment.patientId,
    }));

    return NextResponse.json({ appointments: formattedAppointments });
  } catch (error) {
    // This is the critical part.
    // Log the full error to your server's console for debugging.
    console.error('Error in API route:', error);

    // Always return a JSON response, even if something goes wrong.
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}