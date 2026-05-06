'use client';

import { useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import { Field, FieldLabel, FieldDescription, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const loginSchema = z.object({
  email:    z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router    = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      const result = await authClient.signIn.email({
        email:    values.email,
        password: values.password,
      });
      if (result.error) {
        const msg = result.error.message?.toLowerCase();

        if (msg?.includes('invalid') || msg?.includes('wrong')) {
          toast.error('Invalid email or password');
        } else if (msg?.includes('not found') || msg?.includes('user')) {
          toast.error('Account not found');
        } else {
          toast.error('Login failed. Please try again.');
        }
      } else {
        toast.success('Welcome back!');
        router.push('/dashboard');
        router.refresh();
      }
    } catch {
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#6520EE]/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-64 h-64 bg-[#2BE900]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className={`text-center mb-8 ${mounted ? 'animate-fade-up delay-0' : 'opacity-0'}`}>
          <div className="animate-float inline-block" style={{ animationDelay: '0.3s' }}>
            <Image
              src="/logo-echamps.png"
              alt="E-CHAMPS Logo"
              width={120}
              height={120}
              className="w-24 h-24 mx-auto"
            />
          </div>
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight mt-4">
            <span className="text-[#6520EE]">E</span>
            <span className="text-white">-</span>
            <span className="text-[#2BE900]">CHAMPS</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Enter the arena</p>
        </div>

        {/* Form card */}
        <div className={`bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-8 transition-all duration-500 hover:border-[#6520EE]/30 hover:shadow-[0_0_40px_rgba(101,32,238,0.1)] ${mounted ? 'animate-scale-in delay-100' : 'opacity-0'}`}>
          <h2 className="text-2xl font-bold text-white mb-6">Sign In</h2>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Email */}
            <div className={`${mounted ? 'animate-fade-up delay-200' : 'opacity-0'}`}>
              <Field>
                <FieldLabel htmlFor="email" className="text-sm font-medium text-white">Email</FieldLabel>
                <Input
                  id="email"
                  type="email"
                  placeholder="captain@team.com"
                  className="bg-[#080808] border-[#1a1a1a] text-white placeholder:text-gray-600 focus:border-[#6520EE] focus:ring-[#6520EE] transition-colors duration-200"
                  {...form.register('email')}
                />
                <FieldDescription className="text-gray-500">Your registered email address</FieldDescription>
                {form.formState.errors.email && (
                  <FieldError>{form.formState.errors.email.message}</FieldError>
                )}
              </Field>
            </div>

            {/* Password */}
            <div className={`${mounted ? 'animate-fade-up delay-300' : 'opacity-0'}`}>
              <Field>
                <FieldLabel htmlFor="password" className="text-sm font-medium text-white">Password</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="bg-[#080808] border-[#1a1a1a] text-white placeholder:text-gray-600 focus:border-[#6520EE] focus:ring-[#6520EE] transition-colors duration-200"
                  {...form.register('password')}
                />
                {form.formState.errors.password && (
                  <FieldError>{form.formState.errors.password.message}</FieldError>
                )}
              </Field>
            </div>

            {/* Submit */}
            <div className={`${mounted ? 'animate-fade-up delay-400' : 'opacity-0'}`}>
              <Button
                type="submit"
                disabled={isLoading}
                className="btn-press w-full bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold py-3 h-auto transition-all hover:shadow-[0_0_20px_rgba(101,32,238,0.4)]"
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </Button>
            </div>
          </form>

          <div className={`mt-6 text-center ${mounted ? 'animate-fade-in delay-500' : 'opacity-0'}`}>
            <p className="text-gray-400 text-sm">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="nav-link-animated text-[#2BE900] pb-0.5">
                Register
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
