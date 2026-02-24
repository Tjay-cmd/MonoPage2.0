import Link from "next/link";

export default async function QuoteThanksPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Thank you for your request
        </h1>
        <p className="text-gray-600 mb-8">
          We&apos;ll get back to you within 24 hours.
        </p>
        <Link
          href={`/s/${slug}`}
          className="text-indigo-600 hover:text-indigo-700 font-medium"
        >
          ← Back to site
        </Link>
      </div>
    </div>
  );
}
