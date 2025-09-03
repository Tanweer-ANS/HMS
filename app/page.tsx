'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Heart, Shield, Users, Clock } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';


const features = [
  {
    icon: Heart,
    title: 'Expert Medical Care',
    description: 'Connect with qualified healthcare professionals for personalized treatment plans.',
  },
  {
    icon: Shield,
    title: 'Secure & Private',
    description: 'Your medical data is protected with enterprise-grade security and HIPAA compliance.',
  },
  {
    icon: Users,
    title: 'Comprehensive Care Team',
    description: 'Access a network of specialists, general practitioners, and healthcare experts.',
  },
  {
    icon: Clock,
    title: '24/7 Availability',
    description: 'Book appointments, access records, and get support whenever you need it.',
  },
];

const stats = [
  { number: '10,000+', label: 'Active Patients' },
  { number: '500+', label: 'Healthcare Providers' },
  { number: '50,000+', label: 'Appointments Completed' },
  { number: '4.9/5', label: 'Patient Satisfaction' },
];

export default function Home() {
  const { isSignedIn } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.push('/dashboard');
    }
  }, [isSignedIn, router]);

  return (
    <div className="min-h-screen">
      {/* Navigation */}

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Your Health,
                <span className="text-blue-600"> Our Priority</span>
              </h1>
              <p className="mt-6 text-xl text-gray-600 leading-relaxed">
                Experience seamless healthcare management with our comprehensive digital platform. 
                Book appointments, manage medical records, and connect with healthcare professionals.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/">
                  <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                    Start Your Journey
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="mt-12 lg:mt-0"
            >
                <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-green-400 rounded-2xl blur-2xl opacity-20 animate-pulse"></div>
                <Image
                  src="https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Healthcare Professional"
                  className="relative rounded-2xl shadow-2xl w-full object-cover h-96 lg:h-auto"
                  width={800}
                  height={600}
                  priority
                />
                </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="text-center"
              >
                <div className="text-3xl lg:text-4xl font-bold text-blue-600">{stat.number}</div>
                <div className="text-gray-600 mt-2">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Why Choose HealthCare Plus?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We&#39;re transforming healthcare delivery with innovative technology and compassionate care.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
                  <CardHeader className="text-center pb-4">
                    <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <CardDescription className="text-center text-gray-600">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-green-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Ready to Transform Your Healthcare Experience?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of patients and healthcare providers who trust HealthCare Plus.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 w-full sm:w-auto">
                  Check it Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-white text-blue-800 hover:bg-white hover:text-blue-400 w-full sm:w-auto">
                Contact Sales
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <Heart className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">HealthCare Plus</span>
            </div>
            <div className="text-gray-400">
              © 2024 HealthCare Plus. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}