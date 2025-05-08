import Link from "next/link"

export default function Features() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-6">Features</h1>
      <p className="text-xl mb-8 max-w-2xl text-center">
        This template comes with several features to make your Netlify deployment smooth and efficient.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mb-8">
        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">Routing</h2>
          <p>Proper routing configuration with _redirects file to handle client-side navigation.</p>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">Build Optimization</h2>
          <p>Optimized build configuration for faster deployments and better performance.</p>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">Netlify Plugin</h2>
          <p>Integration with the official Netlify plugin for Next.js.</p>
        </div>

        <div className="p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-2">App Router</h2>
          <p>Uses Next.js App Router for modern routing capabilities.</p>
        </div>
      </div>

      <Link href="/" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
        Back to Home
      </Link>
    </main>
  )
}
