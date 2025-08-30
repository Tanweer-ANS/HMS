import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Doctor from '@/models/Doctor';
import Appointment from '@/models/Appointment';


export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Find the doctor by clerkId
    const doctor = await Doctor.findOne({ clerkId: userId });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Fetch appointments for this doctor with patient details
    const appointments = await Appointment.find({ doctorId: doctor._id })
      .populate('patientId', 'name age gender phone address')
      .sort({ appointmentDate: -1 });

    // Transform the data to match the expected format
    const transformedAppointments = appointments.map(apt => ({
      _id: apt._id,
      patient: {
        _id: apt.patientId._id,
        firstName: apt.patientId.name?.split(' ')[0] || 'Unknown',
        lastName: apt.patientId.name?.split(' ').slice(1).join(' ') || '',
        email: apt.patientId.email || '',
        contactNumber: apt.patientId.phone || '',
        dateOfBirth: apt.patientId.dateOfBirth || new Date().toISOString(),
        gender: apt.patientId.gender || 'Unknown'
      },
      appointmentDate: apt.appointmentDate,
      appointmentTime: apt.appointmentTime,
      status: apt.status,
      reason: apt.reason,
      symptoms: apt.symptoms || [],
      consultationFee: apt.consultationFee,
      notes: apt.notes,
      diagnosis: apt.diagnosis
    }));

    return NextResponse.json({ appointments: transformedAppointments });
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    return NextResponse.json({ error: 'Failed to fetch appointments' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const data = await request.json();
    const { appointmentId, status, notes, diagnosis } = data;

    // Find the doctor by clerkId
    const doctor = await Doctor.findOne({ clerkId: userId });
    if (!doctor) {
      return NextResponse.json({ error: 'Doctor not found' }, { status: 404 });
    }

    // Update the appointment
    const updatedAppointment = await Appointment.findOneAndUpdate(
      { _id: appointmentId, doctorId: doctor._id },
      { status, notes, diagnosis },
      { new: true }
    ).populate('patientId', 'name age gender phone address');

    if (!updatedAppointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true, 
      appointment: updatedAppointment 
    });
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json({ error: 'Failed to update appointment' }, { status: 500 });
  }
}