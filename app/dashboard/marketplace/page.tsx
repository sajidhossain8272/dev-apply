"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function MarketplacePage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Post New Job Modal State (for Clients)
  const [showPostModal, setShowPostModal] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState("FULL_TIME");
  const [budget, setBudget] = useState("");
  const [location, setLocation] = useState("Remote");
  const [description, setDescription] = useState("");
  const [applyEmail, setApplyEmail] = useState("");
  const [posting, setPosting] = useState(false);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);
      const url = filterType !== "ALL" ? `/api/marketplace/jobs?type=${filterType}` : "/api/marketplace/jobs";
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load marketplace jobs.");

      setJobs(data.jobs || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filterType]);

  const handlePostJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setPosting(true);
    setError(null);

    try {
      const res = await fetch("/api/marketplace/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          company,
          type,
          budget,
          location,
          description,
          applyEmail: applyEmail || session?.user?.email,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post job.");

      setShowPostModal(false);
      setTitle("");
      setCompany("");
      setDescription("");
      fetchJobs();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  const handleApplyToJob = (job: any) => {
    // Redirect to Job Applications Studio and pre-fill JD text
    const fullJd = `🚀 Hiring: ${job.title} at ${job.company}\n\nType: ${job.type}\nBudget/Salary: ${job.budget || "Competitive"}\nLocation: ${job.location}\n\n${job.description}\n\n📩 Apply: ${job.applyEmail}`;
    sessionStorage.setItem("devapply_prefill_jd", fullJd);
    router.push("/dashboard/jobs");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="border-b border-neutral-800 pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            <span>💼 Freelance Tasks & Marketplace Jobs</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Browse full-time tech roles and freelance tasks, or post open listings as a client.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowPostModal(true)}
            className="bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10 flex items-center gap-2"
          >
            <span>➕ Post Job / Freelance Task</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-4 overflow-x-auto">
        {[
          { id: "ALL", label: "🌐 All Openings" },
          { id: "FULL_TIME", label: "💼 Full-Time Roles" },
          { id: "FREELANCE_TASK", label: "⚡ Freelance Tasks" },
          { id: "CONTRACT", label: "📜 Contract Jobs" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors whitespace-nowrap ${
              filterType === tab.id
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                : "text-neutral-400 hover:text-white hover:bg-neutral-900"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs font-semibold">
          ⚠️ {error}
        </div>
      )}

      {/* Jobs List */}
      {loading ? (
        <div className="py-20 text-center">
          <span className="text-xs font-bold text-neutral-400 animate-pulse">
            Loading Marketplace Listings...
          </span>
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-12 border border-neutral-800 rounded-2xl bg-neutral-900/30 text-center space-y-4">
          <div className="text-4xl">💼</div>
          <h3 className="text-lg font-bold text-white">No Marketplace Listings Found</h3>
          <p className="text-xs text-neutral-400 max-w-md mx-auto">
            Be the first client to post a freelance engineering task or job opening!
          </p>
          <button
            onClick={() => setShowPostModal(true)}
            className="bg-emerald-400 hover:bg-emerald-300 text-black font-bold text-xs px-5 py-2.5 rounded-xl transition-all"
          >
            Post First Job / Freelance Task
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="p-6 rounded-2xl bg-neutral-900/60 border border-neutral-800 hover:border-neutral-700 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {job.type.replace("_", " ")}
                  </span>
                  <span className="text-xs text-neutral-400 font-mono">
                    📍 {job.location || "Remote"}
                  </span>
                  {job.budget && (
                    <span className="text-xs text-emerald-400 font-bold bg-neutral-950 px-2.5 py-0.5 rounded border border-neutral-800">
                      💰 {job.budget}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-white">{job.title}</h3>
                <p className="text-xs font-semibold text-neutral-400">
                  {job.company} • Posted by {job.postedBy?.name || "Client"}
                </p>

                <p className="text-xs text-neutral-300 line-clamp-3 pt-1">
                  {job.description}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleApplyToJob(job)}
                  className="w-full md:w-auto bg-emerald-400 hover:bg-emerald-300 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-emerald-500/10 whitespace-nowrap"
                >
                  🚀 Apply with Dev-Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Client Post Job Modal */}
      {showPostModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-neutral-950 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-5 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/50">
              <h3 className="text-base font-bold text-white">
                ➕ Post New Job or Freelance Task
              </h3>
              <button
                onClick={() => setShowPostModal(false)}
                className="text-xs text-neutral-400 hover:text-white font-bold"
              >
                ✕ Close
              </button>
            </div>

            <form onSubmit={handlePostJob} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">Job Title</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Senior Full Stack Developer"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">Company / Client Name</label>
                  <input
                    type="text"
                    required
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder="e.g. Penough Ltd."
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">Listing Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="FULL_TIME">Full-Time Job</option>
                    <option value="FREELANCE_TASK">Freelance Task</option>
                    <option value="CONTRACT">Contract Role</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">Budget / Salary</label>
                  <input
                    type="text"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="e.g. $500 or $80k-$100k"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-400 mb-1">Location</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. Remote"
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Recipient Apply Email</label>
                <input
                  type="email"
                  required
                  value={applyEmail}
                  onChange={(e) => setApplyEmail(e.target.value)}
                  placeholder="career@company.com"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-400 mb-1">Description & Requirements</label>
                <textarea
                  rows={6}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Paste full job description or task requirements..."
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-4 text-sm text-neutral-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPostModal(false)}
                  className="px-4 py-2 text-xs font-bold text-neutral-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={posting}
                  className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-50 text-black font-extrabold text-xs px-6 py-2.5 rounded-xl transition-all"
                >
                  {posting ? "Publishing Listing..." : "Publish Job Listing"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
