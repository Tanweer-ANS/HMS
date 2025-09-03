import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Razorpay from 'razorpay';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';

// Initialize Razorpay client
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

export async function POST(request: Request) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('razorpay-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  try {
    // Correct method to validate the webhook signature
    const isValid = Razorpay.validateWebhookSignature(body, signature, secret);
    
    if (!isValid) {
      console.error('Webhook signature verification failed: Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
    
    const event = JSON.parse(body);

    if (event.event === 'payment.captured') {
      const paymentIntent = event.payload.payment.entity;
      const { patientId, doctorId, appointmentDate, appointmentTime, reason, consultationFee } = paymentIntent.notes;

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
          paymentIntentId: paymentIntent.id,
          // Correct payment method
          paymentMethod: 'razorpay', 
        });

        await appointment.save();
        console.log('Appointment created successfully:', appointment._id);

      } catch (error) {
        console.error('Error creating appointment from webhook:', error);
        return NextResponse.json({ error: 'Failed to create appointment' }, { status: 500 });
      }
    }

    return NextResponse.json({ received: true });

  } catch (err) {
    console.error('Error processing webhook event:', err);
    return NextResponse.json({ error: 'Error processing webhook event' }, { status: 500 });
  }
}