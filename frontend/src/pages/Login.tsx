import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Lock, ArrowRight, User, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { authService, Role } from '@/services/auth';

export default function Login() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Role>('student');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleTabChange = (val: string) => {
    setActiveTab(val as Role);
    setIdentifier('');
    setPassword('');
    setErrorMsg(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);

    const currentTab = activeTab;
    const currentId = identifier.trim();

    try {
      console.log(`[LOGIN] Attempting ${currentTab} login for: ${currentId}`);

      let user;
      if (currentTab === 'student') {
        user = await authService.studentLogin(currentId, password);
        toast.success(`Welcome back, ${user.name}!`);
        navigate('/student-dashboard');
      } else if (currentTab === 'teacher') {
        user = await authService.teacherLogin(currentId, password);
        toast.success(`Welcome back, Prof. ${user.name}!`);
        navigate('/dashboard');
      } else if (currentTab === 'admin') {
        user = await authService.adminLogin(currentId, password);
        toast.success('Administrator Access Granted');
        navigate('/admin/dashboard');
      } else if (currentTab === 'advisor') {
        user = await authService.advisorLogin(currentId, password);
        toast.success(`Welcome back, Advisor ${user.name}!`);
        navigate('/advisor/dashboard');
      }
    } catch (error: any) {
      console.error(`[LOGIN ERROR] ${currentTab} login failed:`, error);
      const msg = error.message || 'Login failed. Please check your credentials.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-primary/10 px-4">
      <div className="w-full max-w-md animate-fade-in">

        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white p-2 shadow-lg">
            <img
              src="/easy-attendance-logo.png"
              alt="EasyAttendance Logo"
              className="h-full w-full object-contain"
            />
          </div>
          <h1 className="font-display text-3xl font-bold text-foreground">EasyAttendance</h1>
          <p className="mt-2 text-muted-foreground">Online Attendance Management System</p>
        </div>

        <Card className="card-elevated">
          <CardHeader className="text-center">
            <CardTitle className="font-display text-xl">Welcome Back</CardTitle>
            <CardDescription>Sign in to access your dashboard</CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="student">Student</TabsTrigger>
                <TabsTrigger value="teacher">Teacher</TabsTrigger>
                <TabsTrigger value="advisor">Advisor</TabsTrigger>
                <TabsTrigger value="admin">Admin</TabsTrigger>
              </TabsList>

              <TabsContent value={activeTab}>
                <form onSubmit={handleLogin} className="space-y-4">

                  {errorMsg && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm mb-4">
                      <strong>Error:</strong> {errorMsg}
                    </div>
                  )}

                  {/* Identifier */}
                  <div className="space-y-2">
                    <label htmlFor="identifier" className="text-sm font-medium text-foreground">
                      {activeTab === 'student'
                        ? 'Roll Number'
                        : activeTab === 'teacher'
                          ? 'Teacher ID'
                          : activeTab === 'advisor'
                            ? 'Advisor ID'
                            : 'Email Address'}
                    </label>

                    <div className="relative">
                      {activeTab === 'student' ? (
                        <BookOpen className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      ) : activeTab === 'teacher' ? (
                        <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      ) : (
                        <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      )}

                      <Input
                        id="identifier"
                        type="text"
                        placeholder={
                          activeTab === 'student'
                            ? '23IT151'
                            : activeTab === 'teacher'
                              ? 'TCH001'
                              : activeTab === 'advisor'
                                ? 'ADV001'
                                : 'admin@college.edu'
                        }
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        className="pl-11"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-foreground">
                      Password
                    </label>

                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-11"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" className="h-4 w-4 rounded border-border" />
                      <span className="text-muted-foreground">Remember me</span>
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <Button type="submit" size="lg" className="w-full" disabled={isLoading}>
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></span>
                        Signing in...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Sign In
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>

                  <div className="text-center text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    {activeTab === 'student' && (
                      <Link
                        to="/student-signup"
                        className="text-primary hover:underline font-medium"
                      >
                        Sign up as Student
                      </Link>
                    )}
                  </div>

                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-sm text-muted-foreground">
          © 2026 EasyAttendance. All rights reserved.
        </p>

      </div>
    </div>
  );
}
