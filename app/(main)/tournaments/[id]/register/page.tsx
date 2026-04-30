'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { formatRupiah } from '@indodev/toolkit/currency';
import {
  Field,
  FieldLabel,
  FieldDescription,
  FieldError,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useTournaments, useCreateTeam } from '@/lib/hooks';

const memberSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  gameId: z.string().min(1, 'Game ID is required'),
  role: z.string().min(1, 'Role is required'),
});

const teamRegistrationSchema = z.object({
  teamName: z.string().min(2, 'Team name must be at least 2 characters'),
  contactEmail: z.string().email('Please enter a valid email'),
  contactPhone: z.string().optional(),
  members: z.array(memberSchema).min(1, 'At least one member is required'),
});

type TeamRegistrationFormValues = z.infer<typeof teamRegistrationSchema>;

export default function RegisterTeamPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: categoryId } = use(params);

  const { data: tournaments = [], isLoading: isLoadingTournaments } = useTournaments();
  const createTeamMutation = useCreateTeam();

  const tournament = tournaments.find((t) => t.id === parseInt(categoryId));

  const form = useForm<TeamRegistrationFormValues>({
    resolver: zodResolver(teamRegistrationSchema),
    defaultValues: {
      teamName: '',
      contactEmail: '',
      contactPhone: '',
      members: [{ name: '', gameId: '', role: '' }],
    },
  });

  const { fields, append } = useFieldArray({
    control: form.control,
    name: 'members',
  });

  // Initialize members array based on team size
  useEffect(() => {
    if (tournament) {
      const requiredMembers = tournament.teamSize - 1;
      const currentMembers = fields.length;
      if (currentMembers < requiredMembers) {
        for (let i = currentMembers; i < requiredMembers; i++) {
          append({ name: '', gameId: '', role: '' });
        }
      }
    }
  }, [tournament, append, fields.length]);

  const onSubmit = async (values: TeamRegistrationFormValues) => {
    toast.promise(
      createTeamMutation.mutateAsync({
        teamName: values.teamName,
        categoryId: parseInt(categoryId),
        members: values.members,
        contactEmail: values.contactEmail,
        contactPhone: values.contactPhone || '',
        paymentProofUrl: '',
      }),
      {
        loading: 'Registering team...',
        success: () => {
          router.push('/my-teams');
          return 'Team registered successfully!';
        },
        error: (err: Error) => err.message || 'Failed to register team',
      }
    );
  };

  if (isLoadingTournaments || !tournament) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase mb-2">
        REGISTER TEAM
      </h1>
      <p className="font-[family-name:var(--font-body)] text-gray-400 mb-8">
        {tournament.name}
      </p>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Field>
          <FieldLabel htmlFor="teamName">TEAM NAME</FieldLabel>
          <Input
            id="teamName"
            placeholder="Enter team name"
            className="bg-[#0d0d0d] border-[#1a1a1a] text-white focus:border-[#6520EE] focus:ring-[#6520EE]"
            {...form.register('teamName')}
          />
          {form.formState.errors.teamName && (
            <FieldError>{form.formState.errors.teamName.message}</FieldError>
          )}
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="contactEmail">CONTACT EMAIL</FieldLabel>
            <Input
              id="contactEmail"
              type="email"
              placeholder="captain@team.com"
              className="bg-[#0d0d0d] border-[#1a1a1a] text-white focus:border-[#6520EE] focus:ring-[#6520EE]"
              {...form.register('contactEmail')}
            />
            {form.formState.errors.contactEmail && (
              <FieldError>{form.formState.errors.contactEmail.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel htmlFor="contactPhone">CONTACT PHONE</FieldLabel>
            <Input
              id="contactPhone"
              type="tel"
              placeholder="Optional"
              className="bg-[#0d0d0d] border-[#1a1a1a] text-white focus:border-[#6520EE] focus:ring-[#6520EE]"
              {...form.register('contactPhone')}
            />
          </Field>
        </div>

        <div>
          <h3 className="font-[family-name:var(--font-heading)] text-white mb-4">
            TEAM MEMBERS ({tournament.teamSize - 1} players + Captain)
          </h3>

          {fields.map((field, index) => (
            <div key={field.id} className="grid grid-cols-3 gap-2 mb-2">
              <Field>
                <Input
                  placeholder="Name"
                  className="bg-[#0d0d0d] border-[#1a1a1a] text-white text-sm focus:border-[#6520EE] focus:ring-[#6520EE]"
                  {...form.register(`members.${index}.name`)}
                />
                {form.formState.errors.members?.[index]?.name && (
                  <FieldError className="text-xs">
                    {form.formState.errors.members[index]?.name?.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <Input
                  placeholder="Game ID"
                  className="bg-[#0d0d0d] border-[#1a1a1a] text-white text-sm focus:border-[#6520EE] focus:ring-[#6520EE]"
                  {...form.register(`members.${index}.gameId`)}
                />
                {form.formState.errors.members?.[index]?.gameId && (
                  <FieldError className="text-xs">
                    {form.formState.errors.members[index]?.gameId?.message}
                  </FieldError>
                )}
              </Field>

              <Field>
                <Input
                  placeholder="Role"
                  className="bg-[#0d0d0d] border-[#1a1a1a] text-white text-sm focus:border-[#6520EE] focus:ring-[#6520EE]"
                  {...form.register(`members.${index}.role`)}
                />
                {form.formState.errors.members?.[index]?.role && (
                  <FieldError className="text-xs">
                    {form.formState.errors.members[index]?.role?.message}
                  </FieldError>
                )}
              </Field>
            </div>
          ))}
        </div>

        <div className="border border-[#1a1a1a] p-4 bg-[#0d0d0d]">
          <div className="flex items-center justify-between">
            <span className="font-[family-name:var(--font-heading)] text-white">
              Registration Fee
            </span>
            <span className="font-[family-name:var(--font-display)] text-2xl text-[#6520EE]">
              {formatRupiah(tournament.registrationFee)}
            </span>
          </div>
          <FieldDescription className="text-gray-500 text-sm mt-2">
            Payment instructions will be sent after registration.
          </FieldDescription>
        </div>

        <Button
          type="submit"
          disabled={createTeamMutation.isPending}
          className="w-full bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold py-4 h-auto font-[family-name:var(--font-heading)]"
        >
          {createTeamMutation.isPending ? 'REGISTERING...' : 'REGISTER TEAM'}
        </Button>
      </form>
    </div>
  );
}