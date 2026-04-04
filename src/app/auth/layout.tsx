export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 py-8">
      <div className="mb-6 text-center">
        <span className="text-5xl" role="img" aria-label="bee">
          🐝
        </span>
        <h1 className="mt-2 text-2xl font-bold text-gray-900">BeehiveDrive</h1>
        <p className="text-sm text-gray-500">
          Pass your Utah driver&apos;s test
        </p>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
