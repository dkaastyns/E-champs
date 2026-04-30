import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export default async function ProfilePage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    return null;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">PROFILE</h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">Manage your account.</p>
      </div>

      <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-8 max-w-2xl">
        <div className="space-y-6">
          <div>
            <label className="block font-[family-name:var(--font-heading)] text-gray-400 mb-2">NAME</label>
            <div className="font-[family-name:var(--font-body)] text-white text-lg">{session.user.name}</div>
          </div>

          <div>
            <label className="block font-[family-name:var(--font-heading)] text-gray-400 mb-2">EMAIL</label>
            <div className="font-[family-name:var(--font-body)] text-white text-lg">{session.user.email}</div>
          </div>

          <div>
            <label className="block font-[family-name:var(--font-heading)] text-gray-400 mb-2">ROLE</label>
            <div className="inline-block bg-[#6520EE]/20 text-[#6520EE] px-3 py-1 text-sm font-bold">
              {(session.user.role || 'USER').toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
