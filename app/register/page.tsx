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
import { Field, FieldLabel, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

function getAuthErrorMessage(code?: string): string {
  switch (code) {
    case 'USER_ALREADY_EXISTS': return 'An account with this email already exists.';
    case 'TOO_MANY_REQUESTS': return 'Too many attempts. Please wait a moment.';
    case 'PASSWORD_TOO_SHORT': return 'Password must be at least 8 characters.';
    default: return 'Registration failed. Please try again.';
  }
}

const registerSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

const fields = [
  { id: 'name', type: 'text', label: 'Team Captain Name', placeholder: 'Your Name', key: 'name' },
  { id: 'email', type: 'email', label: 'Email', placeholder: 'captain@team.com', key: 'email' },
  { id: 'password', type: 'password', label: 'Password', placeholder: '••••••••', key: 'password' },
  { id: 'confirmPassword', type: 'password', label: 'Confirm Password', placeholder: '••••••••', key: 'confirmPassword' },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const mounted = useSyncExternalStore(() => () => { }, () => true, () => false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setIsLoading(true);
    try {
      const result = await authClient.signUp.email({
        name: values.name,
        email: values.email,
        password: values.password,
      });
      if (result.error) {
        toast.error(getAuthErrorMessage(result.error.code));
      } else {
        toast.success('Account created successfully!');
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
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4 py-12 relative overflow-hidden">
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
          <p className="text-gray-400 mt-2 text-sm">Join the competition</p>
        </div>

        {/* Form card */}
        <div className={`bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-8 transition-all duration-500 hover:border-[#2BE900]/20 hover:shadow-[0_0_40px_rgba(43,233,0,0.06)] ${mounted ? 'animate-scale-in delay-100' : 'opacity-0'}`}>
          <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {fields.map(({ id, type, label, placeholder, key }, i) => (
              <div key={id} className={`${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: mounted ? `${200 + i * 80}ms` : '0ms' }}>
                <Field>
                  <FieldLabel htmlFor={id} className="text-sm font-medium text-white">{label}</FieldLabel>
                  <Input
                    id={id}
                    type={type}
                    placeholder={placeholder}
                    className="bg-[#080808] border-[#1a1a1a] text-white placeholder:text-gray-600 focus:border-[#2BE900] focus:ring-[#2BE900] transition-colors duration-200"
                    {...form.register(key)}
                  />
                  {form.formState.errors[key] && (
                    <FieldError>{form.formState.errors[key]?.message}</FieldError>
                  )}
                </Field>
              </div>
            ))}

            {/* Submit */}
            <div className={`${mounted ? 'animate-fade-up' : 'opacity-0'}`} style={{ animationDelay: mounted ? '540ms' : '0ms' }}>
              <Button
                type="submit"
                disabled={isLoading}
                className="btn-press w-full bg-[#2BE900] hover:bg-[#25d100] text-black font-bold py-3 h-auto transition-all hover:shadow-[0_0_20px_rgba(43,233,0,0.4)]"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </div>
          </form>

          <div className={`mt-6 text-center ${mounted ? 'animate-fade-in delay-700' : 'opacity-0'}`}>
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="nav-link-animated text-[#6520EE] pb-0.5">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
