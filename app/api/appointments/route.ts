import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';

// Simple payment capture endpoint: marks an appointment as Paid
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json({ error: 'Missing appointmentId' }, { status: 400 });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
    }

    // In a real gateway integration, verify amount, process charge, etc.
    // Here, just mark as Paid.
    appointment.paymentStatus = 'Paid';
    await appointment.save();

    return NextResponse.json({ success: true, appointment });
  } catch (error) {
    console.error('Error processing payment:', error);
    return NextResponse.json({ error: 'Payment processing failed' }, { status: 500 });
  }
}



