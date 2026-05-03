'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useCreateTournament } from '@/lib/hooks';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { PageTransition, RevealOnScroll } from '@/components/ui/page-transition';

export default function NewTournamentPage() {
  const router = useRouter();
  const createTournamentMutation = useCreateTournament();
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string,
      maxTeams: parseInt(formData.get('maxTeams') as string),
      teamSize: parseInt(formData.get('teamSize') as string),
      registrationFee: parseFloat(formData.get('registrationFee') as string),
      tournamentStartDate: startDate ? startDate.toISOString() : null,
      tournamentEndDate: endDate ? endDate.toISOString() : null,
    };

    toast.promise(
      createTournamentMutation.mutateAsync(payload),
      {
        loading: 'Creating tournament...',
        success: () => {
          router.push('/admin/tournaments');
          return 'Tournament created successfully';
        },
        error: (err: Error) => err.message || 'Failed to create tournament',
      }
    );
  };

  return (
    <PageTransition className="max-w-2xl">
      <div className="mb-8">
        <Link href="/admin/tournaments" className="text-[#6520EE] hover:underline text-sm mb-2 inline-block">
          &larr; Back to Tournaments
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">NEW TOURNAMENT</h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">Create a new tournament.</p>
      </div>

      <RevealOnScroll delay={100}>
      <form onSubmit={handleSubmit} className="space-y-4 bg-[#0d0d0d] border border-[#1a1a1a] p-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name *</label>
            <input name="name" required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Slug *</label>
            <input name="slug" required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea name="description" rows={3} className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Teams *</label>
            <input name="maxTeams" type="number" defaultValue={32} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Team Size *</label>
            <input name="teamSize" type="number" defaultValue={5} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fee (Rp) *</label>
            <input name="registrationFee" type="number" step="0.01" defaultValue={0} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Start Date</label>
            <DateTimePicker 
              value={startDate}
              onChange={setStartDate}
              placeholder="Pick start date & time"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">End Date</label>
            <DateTimePicker 
              value={endDate}
              onChange={setEndDate}
              placeholder="Pick end date & time"
            />
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-4">
          <Link href="/admin/tournaments" className="px-6 py-2 text-gray-400 hover:text-white transition-colors">Cancel</Link>
          <button
            type="submit"
            disabled={createTournamentMutation.isPending}
            className="bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-6 py-2 transition-colors disabled:opacity-50"
          >
            {createTournamentMutation.isPending ? 'CREATING...' : 'CREATE TOURNAMENT'}
          </button>
        </div>
      </form>
      </RevealOnScroll>
    </PageTransition>
  );
}