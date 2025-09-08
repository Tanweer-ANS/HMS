'use client';

// Import necessary React hooks and components from various libraries
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, Shield, CheckCircle } from 'lucide-react';
// import PaymentForm from './PaymentForm';
import RazorpayPaymentForm from './RazorpayPaymentForm';

// Define the component's props with TypeScript for better type safety
interface PaymentMethodSelectorProps {
  doctorId: string;
  amount: number;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  onSuccess: () => void;
  onCancel: () => void;
}

// Main PaymentMethodSelector component
export default function PaymentMethodSelector({
  doctorId,
  amount,
  doctorName,
  appointmentDate,
  appointmentTime,
  reason,
  onSuccess,
  onCancel,
}: PaymentMethodSelectorProps) {
  // State to track which payment method is currently selected
  const [selectedMethod, setSelectedMethod] = useState< 'razorpay' | null>(null);

  // Array of payment method objects with their details
  const paymentMethods = [
    {
      id: 'razorpay',
      name: 'Razorpay',
      description: 'Indian payment gateway',
      icon: CreditCard, // Icon for Razorpay
      features: ['UPI, Cards, Net Banking', 'INR currency', 'India focused'],
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
    },
  ];


  // Conditional rendering: if Razorpay is selected, show the Razorpay payment form
  if (selectedMethod === 'razorpay') {
    return (
      <RazorpayPaymentForm
        doctorId={doctorId}
        amount={amount}
        doctorName={doctorName}
        appointmentDate={appointmentDate}
        appointmentTime={appointmentTime}
        reason={reason}
        onSuccess={onSuccess}
        onCancel={() => setSelectedMethod(null)} // Allows user to go back to method selection
      />
    );
  }

  // Default rendering: show the payment method selection screen
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-gray-600" />
          <span>Choose Payment Method</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Appointment Summary section */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-2">Appointment Summary</h3>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Doctor:</strong> Dr. {doctorName}</p>
            <p><strong>Date:</strong> {new Date(appointmentDate).toLocaleDateString()}</p>
            <p><strong>Time:</strong> {appointmentTime}</p>
            {/* Display amount in both USD and INR (assuming a fixed conversion rate of 83) */}
            <p><strong>Amount:</strong> ${amount} / ₹{Math.round(amount * 83)}</p>
          </div>
        </div>

        {/* Payment Methods selection grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all hover:shadow-md border-2 ${
                selectedMethod === method.id ? method.borderColor : 'border-gray-200'
              }`}
              onClick={() => setSelectedMethod(method.id as 'razorpay')}
            >
              <CardContent className="p-4">
                {/* Method header with icon and name/description */}
                <div className="flex items-center space-x-3 mb-3">
                  <method.icon className={`h-6 w-6 ${method.color}`} />
                  <div>
                    <h4 className="font-semibold text-gray-900">{method.name}</h4>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
                
                {/* List of features for the payment method */}
                <ul className="space-y-1 mb-4">
                  {method.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-3 w-3 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Selection button for the payment method */}
                <Button
                  className={`w-full ${method.bgColor} ${method.color} hover:opacity-80`}
                  variant="outline"
                >
                  Select {method.name}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Action Buttons for cancellation */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}