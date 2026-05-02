'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { authClient } from '@/lib/auth-client';
import {
  Field,
  FieldLabel,
  FieldError,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

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

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
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
        toast.error(result.error.message || 'Registration failed');
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
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image
            src="/logo-echamps.png"
            alt="E-CHAMPS Logo"
            width={120}
            height={120}
            className="w-24 h-24 mx-auto"
          />
          <h1 className="font-[family-name:var(--font-display)] text-4xl tracking-tight mt-4">
            <span className="text-[#6520EE]">E</span>
            <span className="text-white">-</span>
            <span className="text-[#2BE900]">CHAMPS</span>
          </h1>
          <p className="text-gray-400 mt-2 text-sm">Join the competition</p>
        </div>

        <div className="bg-[#0d0d0d] border border-[#1a1a1a] rounded-lg p-8">
          <h2 className="text-2xl font-bold text-white mb-6">Create Account</h2>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <Field>
              <FieldLabel htmlFor="name" className="text-sm font-medium text-white">Team Captain Name</FieldLabel>
              <Input
                id="name"
                type="text"
                placeholder="Your Name"
                className="bg-[#080808] border-[#1a1a1a] text-white placeholder:text-gray-600 focus:border-[#2BE900] focus:ring-[#2BE900]"
                {...form.register('name')}
              />
              {form.formState.errors.name && (
                <FieldError>{form.formState.errors.name.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="email" className="text-sm font-medium text-white">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                placeholder="captain@team.com"
                className="bg-[#080808] border-[#1a1a1a] text-white placeholder:text-gray-600 focus:border-[#2BE900] focus:ring-[#2BE900]"
                {...form.register('email')}
              />
              {form.formState.errors.email && (
                <FieldError>{form.formState.errors.email.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword" className="text-sm font-medium text-white">Confirm Password</FieldLabel>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="bg-[#080808] border-[#1a1a1a] text-white placeholder:text-gray-600 focus:border-[#2BE900] focus:ring-[#2BE900]"
                {...form.register('password')}
              />
              {form.formState.errors.password && (
                <FieldError>{form.formState.errors.password.message}</FieldError>
              )}
            </Field>

            <Field>
              <FieldLabel htmlFor="confirmPassword" className="text-sm font-medium text-white">Confirm Password</FieldLabel>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                className="bg-[#080808] border-[#1a1a1a] text-white placeholder:text-gray-600 focus:border-[#2BE900] focus:ring-[#2BE900]"
                {...form.register('confirmPassword')}
              />
              {form.formState.errors.confirmPassword && (
                <FieldError>
                  {form.formState.errors.confirmPassword.message}
                </FieldError>
              )}
            </Field>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[#2BE900] hover:bg-[#25d100] text-black font-bold py-3 h-auto"
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400 text-sm">
              Already have an account?{' '}
              <Link href="/login" className="text-[#6520EE] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>

        <div className="absolute top-1/4 left-10 w-32 h-32 bg-[#6520EE]/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-[#2BE900]/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
