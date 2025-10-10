'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle, CreditCard } from 'lucide-react';

// Extend the global Window interface to include Razorpay
declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

// Define interfaces for type safety
interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayInstance {
  open: () => void;
}

interface RazorpayOrderData {
  keyId: string;
  amount: number;
  currency: string;
  orderId: string;
}

// Component props
interface RazorpayPaymentFormProps {
  doctorId: string;
  amount: number;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Main component
export default function RazorpayPaymentForm({
  doctorId,
  amount,
  doctorName,
  appointmentDate,
  appointmentTime,
  reason,
  onSuccess,
  onCancel,
}: RazorpayPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [orderData, setOrderData] = useState<RazorpayOrderData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Define createOrder with useCallback to avoid missing dependency warnings
  const createOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/payments/create-razorpay-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          doctorId,
          appointmentDate,
          appointmentTime,
          reason,
          consultationFee: amount,
        }),
      });

      if (!response.ok) throw new Error('Failed to create order');

      const data: RazorpayOrderData = await response.json();
      setOrderData(data);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to create order');
    } finally {
      setLoading(false);
    }
  }, [doctorId, appointmentDate, appointmentTime, reason, amount]);

  // Load Razorpay script and create order
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = createOrder;
    script.onerror = () => setError('Failed to load Razorpay script');
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [createOrder]);

  // Handle payment
  const handlePayment = () => {
    if (!orderData || !window.Razorpay) {
      setError('Payment system not ready');
      return;
    }

    const options: RazorpayOptions = {
      key: orderData.keyId,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'HMS Healthcare',
      description: `Appointment with Dr. ${doctorName}`,
      order_id: orderData.orderId,
      handler: (response) => {
        console.log('Payment successful:', response);
        onSuccess();
      },
      prefill: {
        name: 'Patient Name',
        email: 'patient@example.com',
        contact: '+91 9999999999',
      },
      notes: { address: 'Healthcare Management System' },
      theme: { color: '#3B82F6' },
      modal: {
        ondismiss: () => console.log('Payment modal dismissed'),
      },
    };

    try {
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      setError('Failed to open payment form');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Payment Error</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={createOrder}>Try Again</Button>
      </div>
    );
  }

  // Payment form
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="h-5 w-5 text-blue-600" />
          <span>Razorpay Payment</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Appointment Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Appointment Summary</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Doctor:</strong> Dr. {doctorName}</p>
            <p><strong>Date:</strong> {new Date(appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {appointmentTime}</p>
            <p><strong>Amount:</strong> ₹{amount}</p>
          </div>
        </div>

        {/* Payment info */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Payment Details</h4>
          <p className="text-sm text-blue-700">
            You will be redirected to Razorpay&apos;s secure payment gateway to complete your payment.
          </p>
        </div>

        {/* Buttons */}
        <div className="flex justify-end space-x-3">
          <Button variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={!orderData || loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            Pay ₹{amount}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
