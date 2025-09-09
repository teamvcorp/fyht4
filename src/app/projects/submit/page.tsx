import { RootLayout } from '@/components/RootLayout'
import { Container } from '@/components/Container'
import { FadeIn } from '@/components/FadeIn'

export default function SubmitProjectPage() {
  return (
    <RootLayout>
      <Container className="mt-24 sm:mt-32">
        <FadeIn className="mx-auto max-w-3xl">
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight text-neutral-900">
            Submit a project proposal
          </h1>
          <p className="mt-3 text-neutral-600">
            Share your idea. After admin review, approved proposals move to the community voting stage.
          </p>

          <form
            action="/api/projects/proposals"
            method="POST"
            className="mt-8 rounded-3xl border border-neutral-200 bg-white p-6 sm:p-8 shadow-sm"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-neutral-800">Title *</label>
                <input name="title" required className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">Category</label>
                <input name="category" placeholder="Housing / Education / Health…" className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">ZIP code *</label>
                <input name="zipcode" required pattern="\d{5}(-\d{4})?" className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">Funding goal (USD) *</label>
                <input name="fundingGoal" type="number" min="1" step="1" required className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-800">Vote goal (# yes votes) *</label>
                <input name="voteGoal" type="number" min="1" step="1" required className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-800">Short description</label>
                <input name="shortDescription" className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-neutral-800">Full description</label>
                <textarea name="description" rows={6} className="mt-1 w-full rounded-xl border border-neutral-300 px-4 py-3 outline-none focus:border-neutral-500" />
              </div>
            </div>

            <div className="mt-6 flex gap-3">
              <button className="rounded-2xl bg-emerald-600 px-6 py-3 text-white font-semibold hover:bg-emerald-700 transition">
                Submit proposal
              </button>
              <a href="/dashboard" className="rounded-2xl border border-neutral-300 px-6 py-3 font-semibold text-neutral-800 hover:border-neutral-500 transition">
                Cancel
              </a>
            </div>
          </form>
        </FadeIn>
      </Container>
    </RootLayout>
  )
}
