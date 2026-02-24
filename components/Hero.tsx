import Link from "next/link";
import FloatingPaths from "./FloatingPaths";

export default function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-gradient-to-b from-indigo-50 to-white py-20 px-4 sm:px-6 lg:px-8">
      <FloatingPaths />
      <div className="relative z-10 mx-auto max-w-7xl text-center">
        <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
          Your service business,
          <span className="block text-indigo-600">online in minutes</span>
        </h1>
        <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
          Create your professional website, accept payments with PayFast, and
          access powerful tools designed specifically for your industry.
        </p>
        <div className="mt-10 flex items-center justify-center gap-x-6">
          <Link
            href="/signup"
            className="rounded-md bg-indigo-600 px-6 py-3 text-base font-semibold text-white shadow-sm hover:bg-indigo-700 transition-all hover:scale-105"
          >
            Get Started Free
          </Link>
          <Link
            href="#how-it-works"
            className="text-base font-semibold leading-6 text-gray-900 hover:text-indigo-600 transition-colors"
          >
            See how it works <span aria-hidden="true">→</span>
          </Link>
        </div>
        <div className="mt-16 flex justify-center">
          <div className="relative rounded-xl bg-gray-900/5 p-2 ring-1 ring-inset ring-gray-900/10 lg:rounded-2xl lg:p-4">
            <div className="bg-white rounded-lg shadow-2xl w-full aspect-video flex items-center justify-center">
              <p className="text-gray-400 text-sm">Website Preview</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
