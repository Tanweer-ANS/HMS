import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import crypto from 'crypto';

export async function POST(request: Request) {
  const body = await request.text();
  const headerList = await headers();
  const signature = headerList.get('x-razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  try {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
      .update(body)
      .digest('hex');

    if (signature !== expectedSignature) {
      console.error('Webhook signature verification failed');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const payment = event.payload.payment.entity;
      const order = event.payload.order.entity;
      
      const { patientId, doctorId, appointmentDate, appointmentTime, reason, consultationFee } = order.notes;

      try {
        await connectDB();

        // Check if appointment already exists
        const existingAppointment = await Appointment.findOne({
          patientId,
          doctorId,
          appointmentDate: new Date(appointmentDate),
          appointmentTime,
        });

        if (existingAppointment) {
          console.log('Appointment already exists:', existingAppointment._id);
          return NextResponse.json({ received: true });
        }

        // Create new appointment
        const appointment = new Appointment({
          patientId,
          doctorId,
          appointmentDate: new Date(appointmentDate),
          appointmentTime,
          reason,
          consultationFee: parseFloat(consultationFee),
          status: 'Confirmed',
          paymentStatus: 'Paid',
          paymentIntentId: payment.id,
          paymentMethod: 'razorpay',
        });

        await appointment.save();
        console.log('Appointment created successfully from Razorpay:', appointment._id);

      } catch (error) {
        console.error('Error creating appointment from Razorpay webhook:', error);
        return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Razorpay webhook:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
