import Link from "next/link";

export default async function QuoteErrorPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ message?: string }>;
}) {
  const { slug } = await params;
  const { message } = await searchParams;
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h1>
        <p className="text-gray-600 mb-8">
          {message || "Please try again later."}
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
