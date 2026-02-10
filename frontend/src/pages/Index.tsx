import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { GraduationCap, CheckCircle, Users, BarChart3, Cloud, ArrowRight } from 'lucide-react';

export default function Index() {
  const navigate = useNavigate();

  const features = [
    {
      icon: CheckCircle,
      title: 'Easy Attendance Marking',
      description: 'Mark attendance for entire classes with just a few clicks. Present, Absent, or On Duty.',
    },
    {
      icon: Users,
      title: 'Student Records',
      description: 'Track individual student attendance history, performance metrics, and eligibility status.',
    },
    {
      icon: BarChart3,
      title: 'Detailed Analytics',
      description: 'View class-wise and student-wise attendance reports with visual insights.',
    },
    {
      icon: Cloud,
      title: 'Cloud Storage',
      description: 'All data securely stored in the cloud. Access from anywhere, anytime.',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center animate-fade-in">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white p-2 shadow-xl">
            <img src="/easy-attendance-logo.png" alt="EasyAttendance Logo" className="h-full w-full object-contain" />
          </div>
          <h1 className="font-display text-5xl font-bold tracking-tight text-foreground md:text-6xl">
            EasyAttendance
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-xl text-muted-foreground">
            A modern, cloud-based attendance management system for educational institutions.
            Simple, efficient, and reliable.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button size="lg" onClick={() => navigate('/login')} className="text-base">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-base">
              Learn More
            </Button>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 pb-20">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="card-elevated p-6 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <feature.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold text-foreground">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="border-t border-border bg-card/50">
        <div className="container mx-auto px-4 py-16">
          <div className="grid gap-8 text-center md:grid-cols-4">
            <div className="animate-fade-in">
              <p className="text-4xl font-bold font-display text-primary">50+</p>
              <p className="mt-1 text-muted-foreground">Institutions</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <p className="text-4xl font-bold font-display text-primary">10K+</p>
              <p className="mt-1 text-muted-foreground">Students</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <p className="text-4xl font-bold font-display text-primary">500+</p>
              <p className="mt-1 text-muted-foreground">Teachers</p>
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '300ms' }}>
              <p className="text-4xl font-bold font-display text-primary">1M+</p>
              <p className="mt-1 text-muted-foreground">Records Processed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <img src="/easy-attendance-logo.png" alt="EasyAttendance Logo" className="h-8 w-8 object-contain" />
              <span className="font-display font-bold text-foreground">EasyAttendance</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 EasyAttendance. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
