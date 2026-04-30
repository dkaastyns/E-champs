export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-8xl font-black text-[#6520EE] mb-4">403</div>
        <h1 className="text-3xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-gray-400 mb-8">
          You don&apos;t have permission to access this area.
        </p>
        <a
          href="/dashboard"
          className="inline-block bg-[#6520EE] hover:bg-[#7c3aed] text-white font-bold px-8 py-3 rounded transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  );
}
