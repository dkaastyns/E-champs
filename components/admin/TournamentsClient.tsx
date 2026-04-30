'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { useTournaments, useCreateTournament, useUpdateTournament, useDeleteTournament } from '@/lib/hooks';
import { Tournament } from '@/lib/api';
import { formatRupiah } from '@indodev/toolkit/currency';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface TournamentsClientProps {
  tournaments: Tournament[];
}

export default function TournamentsClient({ tournaments: initialTournaments }: TournamentsClientProps) {
  const { data: tournaments = initialTournaments } = useTournaments();
  const createTournamentMutation = useCreateTournament();
  const updateTournamentMutation = useUpdateTournament();
  const deleteTournamentMutation = useDeleteTournament();

  const [editing, setEditing] = useState<Tournament | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editEndDate, setEditEndDate] = useState<Date | undefined>(undefined);
  const [createStartDate, setCreateStartDate] = useState<Date | undefined>(undefined);
  const [createEndDate, setCreateEndDate] = useState<Date | undefined>(undefined);

  const openEditDialog = (tournament: Tournament) => {
    setEditing(tournament);
    setEditStartDate(tournament.tournamentStartDate ? new Date(tournament.tournamentStartDate) : undefined);
    setEditEndDate(tournament.tournamentEndDate ? new Date(tournament.tournamentEndDate) : undefined);
  };

  const closeEditDialog = () => {
    setEditing(null);
    setEditStartDate(undefined);
    setEditEndDate(undefined);
  };

  const openCreateDialog = () => {
    setShowCreateDialog(true);
    setCreateStartDate(undefined);
    setCreateEndDate(undefined);
  };

  const closeCreateDialog = () => {
    setShowCreateDialog(false);
    setCreateStartDate(undefined);
    setCreateEndDate(undefined);
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-[#2BE900]/20 text-[#2BE900]';
      case 'ongoing': return 'bg-[#6520EE]/20 text-[#6520EE]';
      case 'completed': return 'bg-gray-500/20 text-gray-400';
      default: return 'bg-orange-500/20 text-orange-500';
    }
  };

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editing) return;

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string,
      maxTeams: parseInt(formData.get('maxTeams') as string),
      teamSize: parseInt(formData.get('teamSize') as string),
      registrationFee: parseFloat(formData.get('registrationFee') as string),
      tournamentStartDate: editStartDate ? editStartDate.toISOString() : null,
      tournamentEndDate: editEndDate ? editEndDate.toISOString() : null,
      status: formData.get('status') as 'open' | 'closed' | 'ongoing' | 'completed',
    };

    toast.promise(
      updateTournamentMutation.mutateAsync({ id: editing.id, input: payload }),
      {
        loading: 'Updating tournament...',
        success: () => {
          closeEditDialog();
          return 'Tournament updated successfully';
        },
        error: (err: Error) => err.message || 'Failed to update tournament',
      }
    );
  };

  const handleDelete = async (id: number) => {
    toast.promise(
      deleteTournamentMutation.mutateAsync(id),
      {
        loading: 'Deleting tournament...',
        success: () => {
          setShowDeleteConfirm(null);
          return 'Tournament deleted successfully';
        },
        error: (err: Error) => {
          setShowDeleteConfirm(null);
          return err.message || 'Failed to delete tournament';
        },
      }
    );
  };

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const payload = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      description: formData.get('description') as string,
      maxTeams: parseInt(formData.get('maxTeams') as string),
      teamSize: parseInt(formData.get('teamSize') as string),
      registrationFee: parseFloat(formData.get('registrationFee') as string),
      tournamentStartDate: createStartDate ? createStartDate.toISOString() : null,
      tournamentEndDate: createEndDate ? createEndDate.toISOString() : null,
      status: formData.get('status') as 'open' | 'closed' | 'ongoing' | 'completed',
    };

    toast.promise(
      createTournamentMutation.mutateAsync(payload),
      {
        loading: 'Creating tournament...',
        success: () => {
          closeCreateDialog();
          return 'Tournament created successfully';
        },
        error: (err: Error) => err.message || 'Failed to create tournament',
      }
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">TOURNAMENTS</h1>
          <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">Manage tournament events and competitions.</p>
        </div>
        <button
          onClick={openCreateDialog}
          className="bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-6 py-3 font-[family-name:var(--font-heading)] transition-colors"
        >
          CREATE NEW
        </button>
      </div>

      <div className="bg-[#0d0d0d] border border-[#1a1a1a] overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#1a1a1a]">
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">NAME</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">SLUG</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">STATUS</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">TEAMS</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">FEE</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">START</th>
              <th className="text-left py-3 px-4 text-gray-400 font-[family-name:var(--font-heading)] text-sm">ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {tournaments.map((tournament) => (
              <tr key={tournament.id} className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]">
                <td className="py-4 px-4">
                  <div className="font-[family-name:var(--font-heading)] text-white">{tournament.name}</div>
                  <div className="text-gray-500 text-sm line-clamp-1">{tournament.description}</div>
                </td>
                <td className="py-4 px-4 text-gray-400 font-[family-name:var(--font-body)]">{tournament.slug}</td>
                <td className="py-4 px-4">
                  <span className={`px-2 py-1 text-xs font-bold ${statusColor(tournament.status)}`}>
                    {tournament.status.toUpperCase()}
                  </span>
                </td>
                <td className="py-4 px-4 text-white">{tournament.team_count || 0} / {tournament.maxTeams}</td>
                <td className="py-4 px-4 text-[#6520EE] font-bold">{formatRupiah(tournament.registrationFee)}</td>
                <td className="py-4 px-4 text-gray-400 text-sm">
                  {tournament.tournamentStartDate ? new Date(tournament.tournamentStartDate).toLocaleDateString() : '-'}
                </td>
                <td className="py-4 px-4">
                  <div className="flex gap-2">
                     <button
                      onClick={() => openEditDialog(tournament)}
                      className="bg-[#6520EE]/20 text-[#6520EE] hover:bg-[#6520EE]/30 px-3 py-1 text-sm font-[family-name:var(--font-heading)] transition-colors"
                    >
                      EDIT
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(tournament.id)}
                      className="bg-red-500/20 text-red-500 hover:bg-red-500/30 px-3 py-1 text-sm font-[family-name:var(--font-heading)] transition-colors"
                    >
                      DELETE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {tournaments.length === 0 && (
        <div className="text-center py-12 bg-[#0d0d0d] border border-[#1a1a1a]">
          <p className="text-gray-400">No tournaments found.</p>
          <button onClick={openCreateDialog} className="text-[#6520EE] hover:underline mt-2 inline-block">
            Create your first tournament
          </button>
        </div>
      )}

      {/* Edit Dialog */}
      {editing && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 animate-in fade-in-0 duration-100"
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 animate-in fade-in-0 zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Edit Tournament</h2>
              <button onClick={() => closeEditDialog()} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input name="name" defaultValue={editing.name} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Slug</label>
                  <input name="slug" defaultValue={editing.slug} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea name="description" defaultValue={editing.description || ''} rows={3} className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Teams</label>
                  <input name="maxTeams" type="number" defaultValue={editing.maxTeams} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Team Size</label>
                  <input name="teamSize" type="number" defaultValue={editing.teamSize} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fee (Rp)</label>
                  <input name="registrationFee" type="number" step="0.01" defaultValue={editing.registrationFee} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <Select name="status" defaultValue={editing.status}>
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
                    value={editStartDate}
                    onChange={setEditStartDate}
                    placeholder="Pick start date & time"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">End Date</label>
                  <DateTimePicker
                    value={editEndDate}
                    onChange={setEditEndDate}
                    placeholder="Pick end date & time"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => setEditing(null)} className="px-6 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
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
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="bg-[#0d0d0d] border border-red-500/30 w-full max-w-md p-6 text-center">
            <h3 className="text-xl font-bold text-white mb-2">Delete Tournament?</h3>
            <p className="text-gray-400 mb-6">This action cannot be undone. Teams and matches will block deletion.</p>
            <div className="flex justify-center gap-4">
              <button onClick={() => setShowDeleteConfirm(null)} className="px-6 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteTournamentMutation.isPending}
                className="bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 px-6 py-2 font-bold transition-colors disabled:opacity-50"
              >
                {deleteTournamentMutation.isPending ? 'DELETING...' : 'DELETE'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Dialog */}
      {showCreateDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 animate-in fade-in-0 duration-100"
          onClick={(e) => e.target === e.currentTarget && closeCreateDialog()}
        >
          <div className="bg-[#0d0d0d] border border-[#1a1a1a] w-full max-w-2xl max-h-[90vh] overflow-y-auto p-8 animate-in fade-in-0 zoom-in-95 duration-100">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-white">Create New Tournament</h2>
              <button onClick={() => closeCreateDialog()} className="text-gray-400 hover:text-white text-xl">×</button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Name</label>
                  <input name="name" required placeholder="e.g., Valorant Open" className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Slug</label>
                  <input name="slug" required placeholder="e.g., valorant-open" className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-sm text-gray-400 mb-1">Description</label>
                <textarea name="description" rows={3} placeholder="Brief description of the tournament..." className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Max Teams</label>
                  <input name="maxTeams" type="number" defaultValue={32} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Team Size</label>
                  <input name="teamSize" type="number" defaultValue={5} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Fee (Rp)</label>
                  <input name="registrationFee" type="number" step="0.01" defaultValue={0} required className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 focus:border-[#6520EE] focus:outline-none" />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Status</label>
                  <input type="hidden" name="status" value="open" />
                  <div className="w-full bg-[#1a1a1a] border border-[#1a1a1a] text-white px-4 py-2 flex items-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-none text-xs font-medium bg-green-500/20 text-green-400">
                      Open
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Start Date</label>
                  <DateTimePicker
                    value={createStartDate}
                    onChange={setCreateStartDate}
                    placeholder="Pick start date & time"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">End Date</label>
                  <DateTimePicker
                    value={createEndDate}
                    onChange={setCreateEndDate}
                    placeholder="Pick end date & time"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <button type="button" onClick={() => closeCreateDialog()} className="px-6 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                <button
                  type="submit"
                  disabled={createTournamentMutation.isPending}
                  className="bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-6 py-2 transition-colors disabled:opacity-50"
                >
                  {createTournamentMutation.isPending ? 'CREATING...' : 'CREATE TOURNAMENT'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}