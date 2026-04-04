export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center">
      <div className="w-full max-w-lg mx-auto px-4 py-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <span className="text-5xl">🐝</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">BeehiveDrive</h1>
          <p className="text-sm text-gray-500">Pass your Utah driver&apos;s test</p>
        </div>

        {children}
      </div>
    </div>
  );
}
