'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Stethoscope } from 'lucide-react';
import { motion } from 'framer-motion';

const specializations = [
  'General Medicine',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Gastroenterology',
  'Neurology',
  'Oncology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Radiology',
  'Surgery',
];

const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '14:00', '14:30', '15:00', '15:30',
  '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
];

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function DoctorOnboarding() {
  const { user } = useUser();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    specialization: '',
    experience: '',
    qualification: '',
    contactNumber: '',
    consultationFee: '',
    biography: '',
    availableSlots: [] as Array<{ day: string; startTime: string; endTime: string }>,
  });

  const handleSlotChange = (day: string, field: 'startTime' | 'endTime', value: string) => {
    const existingSlotIndex = formData.availableSlots.findIndex(slot => slot.day === day);

    if (existingSlotIndex >= 0) {
      const updatedSlots = [...formData.availableSlots];
      updatedSlots[existingSlotIndex] = {
        ...updatedSlots[existingSlotIndex],
        [field]: value,
      };
      setFormData(prev => ({ ...prev, availableSlots: updatedSlots }));
    } else {
      const newSlot = { day, startTime: '', endTime: '', [field]: value };
      setFormData(prev => ({
        ...prev,
        availableSlots: [...prev.availableSlots, newSlot]
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch('/api/doctor/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: user.id,
          ...formData,
          experience: parseInt(formData.experience),
          consultationFee: parseInt(formData.consultationFee),
        }),
      });

      if (response.ok) {
        router.push('/dashboard');
      }
    } catch (error) {
      console.error('Error updating doctor profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">HealthCare Plus</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Complete Your Doctor Profile
            </h1>
            <p className="text-gray-600">
              Help patients find you by providing your professional details
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Stethoscope className="h-5 w-5 text-green-600" />
                <span>Professional Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="specialization">Specialization *</Label>
                    {/* <Select
                      value={formData.specialization}
                      onValueChange={(value:any) => setFormData(prev => ({ ...prev, specialization: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {specializations.map((spec) => (
                          <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select> */}
                    <Select value={formData.specialization} onValueChange={(value: string) => setFormData({ ...formData, specialization: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select specialization">
                          {formData.specialization}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {specializations.map(spec => (
                          <SelectItem key={spec} value={spec}>
                            {spec}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="experience">Years of Experience *</Label>
                    <Input
                      id="experience"
                      type="number"
                      value={formData.experience}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, experience: e.target.value }))}
                      placeholder="e.g., 5"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="qualification">Qualification *</Label>
                    <Input
                      id="qualification"
                      value={formData.qualification}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, qualification: e.target.value }))}
                      placeholder="e.g., MBBS, MD"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="contactNumber">Contact Number *</Label>
                    <Input
                      id="contactNumber"
                      value={formData.contactNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                      placeholder="+1 (555) 123-4567"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="consultationFee">Consultation Fee (USD) *</Label>
                    <Input
                      id="consultationFee"
                      type="number"
                      value={formData.consultationFee}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData(prev => ({ ...prev, consultationFee: e.target.value }))}
                      placeholder="100"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="biography">Biography</Label>
                  <Textarea
                    id="biography"
                    value={formData.biography}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData(prev => ({ ...prev, biography: e.target.value }))}
                    placeholder="Tell patients about yourself, your approach to healthcare, and your experience..."
                    rows={4}
                  />
                </div>

                <div>
                  <Label>Available Time Slots</Label>
                  <div className="space-y-4 mt-2">
                    {days.map((day) => {
                      const slot = formData.availableSlots.find(s => s.day === day);
                      return (
                        <div key={day} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border rounded-lg">
                          <div className="font-medium">{day}</div>
                          <div>
                            <Select
                              value={slot?.startTime || ''}
                              onValueChange={(value: string) => handleSlotChange(day, 'startTime', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Start time" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Select
                              value={slot?.endTime || ''}
                              onValueChange={(value: string) => handleSlotChange(day, 'endTime', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="End time" />
                              </SelectTrigger>
                              <SelectContent>
                                {timeSlots.map((time) => (
                                  <SelectItem key={time} value={time}>{time}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  {loading ? 'Saving...' : 'Complete Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}