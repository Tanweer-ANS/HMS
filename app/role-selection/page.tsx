
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck, Stethoscope, ArrowRight, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RoleSelection() {
  const { user } = useUser();
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<'patient' | 'doctor' | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRoleSelection = async (role: 'patient' | 'doctor') => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/user/role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user.id,
          role,
          email: user.emailAddresses[0]?.emailAddress,
          firstName: user.firstName,
          lastName: user.lastName,
        }),
      });

      if (response.ok) {
        await user.update({
          unsafeMetadata: { role }
        });
        router.push(role === 'doctor' ? '/doctor/onboarding' : '/patient/onboarding');
      }
    } catch (error) {
      console.error('Error setting role:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-4xl"
      >
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <Heart className="h-10 w-10 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">HealthCare Plus</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome, {user?.firstName}!
          </h1>
          <p className="text-xl text-gray-600">
            Please select your role to customize your experience
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                selectedRole === 'patient' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-blue-300'
              }`}
              onClick={() => setSelectedRole('patient')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                  <UserCheck className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">I&#39;m a Patient</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-lg text-gray-600 mb-6">
                  Book appointments, manage your medical records, and connect with healthcare professionals.
                </CardDescription>
                <ul className="text-sm text-gray-500 space-y-2 mb-6">
                  <li>• Schedule appointments with doctors</li>
                  <li>• Access your medical history</li>
                  <li>• Manage prescriptions</li>
                  <li>• Track your health journey</li>
                </ul>
                <Button
                  onClick={() => handleRoleSelection('patient')}
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  Continue as Patient
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Card 
              className={`cursor-pointer transition-all duration-300 hover:shadow-xl border-2 ${
                selectedRole === 'doctor' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-green-300'
              }`}
              onClick={() => setSelectedRole('doctor')}
            >
              <CardHeader className="text-center pb-4">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <Stethoscope className="h-8 w-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900">I&#39;m a Healthcare Provider</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <CardDescription className="text-lg text-gray-600 mb-6">
                  Manage your practice, view patient appointments, and provide quality healthcare services.
                </CardDescription>
                <ul className="text-sm text-gray-500 space-y-2 mb-6">
                  <li>• Manage patient appointments</li>
                  <li>• Access patient medical records</li>
                  <li>• Update treatment plans</li>
                  <li>• Generate reports and analytics</li>
                </ul>
                <Button
                  onClick={() => handleRoleSelection('doctor')}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Continue as Provider
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
