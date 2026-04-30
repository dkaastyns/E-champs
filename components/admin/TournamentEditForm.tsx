'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useUpdateTournament } from '@/lib/hooks';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Tournament {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  maxTeams: number;
  teamSize: number;
  registrationFee: number;
  tournamentStartDate: string | null;
  tournamentEndDate: string | null;
  status: string;
}

export default function TournamentEditForm({ tournament }: { tournament: Tournament }) {
  const router = useRouter();
  const updateTournamentMutation = useUpdateTournament();
  const [startDate, setStartDate] = useState<Date | undefined>(
    tournament.tournamentStartDate ? new Date(tournament.tournamentStartDate) : undefined
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    tournament.tournamentEndDate ? new Date(tournament.tournamentEndDate) : undefined
  );

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
      status: formData.get('status') as 'open' | 'closed' | 'ongoing' | 'completed',
    };

    toast.promise(
      updateTournamentMutation.mutateAsync({ id: tournament.id, input: payload }),
      {
        loading: 'Updating tournament...',
        success: () => {
          router.push('/admin/tournaments');
          return 'Tournament updated successfully';
        },
        error: (err: Error) => err.message || 'Failed to update tournament',
      }
    );
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <Link href="/admin/tournaments" className="text-[#6520EE] hover:underline text-sm mb-2 inline-block">
          &larr; Back to Tournaments
        </Link>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">EDIT TOURNAMENT</h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">Update tournament details.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 bg-[#0d0d0d] border border-[#1a1a1a] p-8">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Name *</label>
            <input name="name" defaultValue={tournament.name} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Slug *</label>
            <input name="slug" defaultValue={tournament.slug} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-1">Description</label>
          <textarea name="description" defaultValue={tournament.description || ''} rows={3} className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Max Teams *</label>
            <input name="maxTeams" type="number" defaultValue={tournament.maxTeams} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Team Size *</label>
            <input name="teamSize" type="number" defaultValue={tournament.teamSize} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Fee (Rp) *</label>
            <input name="registrationFee" type="number" step="0.01" defaultValue={tournament.registrationFee} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Status *</label>
            <Select name="status" defaultValue={tournament.status}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="ongoing">Ongoing</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
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
            disabled={updateTournamentMutation.isPending}
            className="bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-6 py-2 transition-colors disabled:opacity-50"
          >
            {updateTournamentMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
          </button>
        </div>
      </form>
    </div>
  );
}
