import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { PageTransition, RevealOnScroll } from "@/components/ui/page-transition";

export default async function ProfilePage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;

  const fields = [
    { label: "NAME",  value: session.user.name },
    { label: "EMAIL", value: session.user.email },
  ];

  return (
    <PageTransition className="space-y-8">
      {/* Page header */}
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-5xl text-white uppercase">
          PROFILE
        </h1>
        <p className="font-[family-name:var(--font-body)] text-gray-400 mt-2">
          Manage your account.
        </p>
      </div>

      {/* Profile card */}
      <RevealOnScroll delay={100}>
        <div className="bg-[#0d0d0d] border border-[#1a1a1a] p-8 max-w-2xl transition-all duration-300 hover:border-[#6520EE]/30 hover:shadow-[0_0_30px_rgba(101,32,238,0.08)]">
          <div className="space-y-6">
            {fields.map(({ label, value }, i) => (
              <RevealOnScroll key={label} delay={150 + i * 80}>
                <div className="group">
                  <label className="block font-[family-name:var(--font-heading)] text-gray-500 mb-1 text-xs tracking-widest transition-colors duration-200 group-hover:text-gray-400">
                    {label}
                  </label>
                  <div className="font-[family-name:var(--font-body)] text-white text-lg border-b border-[#1a1a1a] pb-3 transition-colors duration-200 group-hover:border-[#333]">
                    {value}
                  </div>
                </div>
              </RevealOnScroll>
            ))}

            {/* Role badge */}
            <RevealOnScroll delay={310}>
              <div>
                <label className="block font-[family-name:var(--font-heading)] text-gray-500 mb-2 text-xs tracking-widest">
                  ROLE
                </label>
                <div className="inline-block bg-[#6520EE]/20 text-[#6520EE] px-3 py-1 text-sm font-bold transition-all duration-300 hover:bg-[#6520EE]/30 hover:shadow-[0_0_12px_rgba(101,32,238,0.3)]">
                  {(session.user.role || "USER").toUpperCase()}
                </div>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </RevealOnScroll>
    </PageTransition>
  );
}
