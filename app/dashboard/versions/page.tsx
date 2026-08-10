"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";
import { SiteHeader } from "@/components/layout/SiteHeader";
import Link from "next/link";

export default function VersionsPage() {
    const { status } = useSession();
    const [snapshots, setSnapshots] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rollingBack, setRollingBack] = useState<string | null>(null);

    const fetchSnapshots = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/profile/snapshots");
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to fetch history");
            setSnapshots(data.snapshots || []);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (status === "authenticated") {
            fetchSnapshots();
        }
    }, [status]);

    const handleRollback = async (id: string) => {
        if (!confirm("Are you sure you want to rollback? Current unsaved changes will be lost.")) return;

        setRollingBack(id);
        try {
            const res = await fetch("/api/profile/rollback", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ snapshotId: id }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Rollback failed");
            alert("Rollback successful!");
            window.location.href = "/dashboard";
        } catch (err: any) {
            alert(err.message);
        } finally {
            setRollingBack(null);
        }
    };

    if (status === "loading" || loading) {
        return (
            <div className="py-32 text-center">
                <span className="text-xs font-black uppercase tracking-[0.5em] animate-pulse">Accessing Archives...</span>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-12">
                    <header className="space-y-4 border-b border-[var(--border)] pb-12">
                        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                            <div className="space-y-1">
                                <Link href="/dashboard" className="text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] hover:text-[var(--fg)] no-underline mb-4 block">
                                    ← Back to Command Center
                                </Link>
                                <h1 className="text-4xl font-bold tracking-tighter uppercase text-[var(--fg)]">Version Control</h1>
                                <p className="text-sm font-medium text-[var(--muted)] uppercase tracking-widest">Portfolio Snapshots & Recovery</p>
                            </div>
                        </div>
                    </header>

                    {error && <div className="border border-[var(--fg)] p-4 text-[10px] font-bold uppercase text-[var(--fg)]">{error}</div>}

                    <div className="space-y-8">
                        {snapshots.length === 0 ? (
                            <div className="border border-[var(--border)] p-12 text-center">
                                <p className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">No historical data found.</p>
                            </div>
                        ) : (
                            snapshots.map((s) => (
                                <div key={s.id} className="border border-[var(--border)] bg-[var(--surface)] p-8 flex flex-col justify-between gap-6 sm:flex-row sm:items-center hover:border-[var(--fg)] transition-colors">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-black uppercase tracking-widest text-[var(--fg)]">
                                                {new Date(s.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-[10px] text-[var(--muted)] uppercase">
                                                {new Date(s.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold uppercase tracking-wider text-[var(--muted)]">
                                            {s.summary || "Manual Save"}
                                        </p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="h-10 text-[10px]"
                                        onClick={() => handleRollback(s.id)}
                                        disabled={rollingBack === s.id}
                                    >
                                        {rollingBack === s.id ? "RESTORING..." : "ROLLBACK TO THIS VERSION"}
                                    </Button>
                                </div>
                            ))
                        )}
                    </div>
        </div>
    );
}
