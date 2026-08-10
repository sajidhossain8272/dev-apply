/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut, signIn } from "next-auth/react";

interface SaaSLayoutProps {
  children: React.ReactNode;
}

export function SaaSLayout({ children }: SaaSLayoutProps) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const userRole = (session?.user as any)?.role || "DEVELOPER";

  // Dynamic Navigation Items per Role
  const navItems = [
    {
      group: "STUDIO APPS",
      items: [
        {
          name: "Dashboard",
          href: "/dashboard",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          ),
        },
        {
          name: "Marketplace & Jobs",
          href: "/dashboard/marketplace",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          ),
          badge: "New",
        },
        {
          name: "Job Applications",
          href: "/dashboard/jobs",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          ),
          badge: "AI Powered",
        },
        {
          name: "Portfolio Builder",
          href: "/dashboard/portfolio",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          ),
        },
        {
          name: "Resume Studio",
          href: "/dashboard/resume",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
      ],
    },
    {
      group: "MANAGEMENT",
      items: [
        {
          name: "Settings & Sync Profile",
          href: "/dashboard/settings",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          ),
          badge: "Sync",
        },
        {
          name: "Version History",
          href: "/dashboard/versions",
          icon: (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ),
        },
      ],
    },
  ];

  // Helper to resolve current page title for top bar
  const getPageTitle = () => {
    if (pathname === "/dashboard") return `${userRole === "CLIENT" ? "Client / Buyer" : "Developer"} Dashboard`;
    if (pathname.startsWith("/dashboard/jobs/")) return "Job Application Apply Studio";
    if (pathname === "/dashboard/jobs") return "Job Applications Studio";
    if (pathname === "/dashboard/portfolio") return "Portfolio Builder";
    if (pathname === "/dashboard/resume") return "Resume Studio";
    if (pathname === "/dashboard/marketplace") return "Freelance Tasks & Marketplace Jobs";
    if (pathname === "/dashboard/settings") return "Settings & Sync Profile";
    if (pathname === "/dashboard/versions") return "Version Control & Snapshots";
    return "SaaS Studio";
  };

  // Strict Protection: Render loading spinner while checking session
  if (status === "loading") {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          <span className="text-xs text-neutral-400 font-mono">Authenticating SaaS OS...</span>
        </div>
      </div>
    );
  }

  // Strict Protection: Unauthenticated visitors redirected to /login
  if (status === "unauthenticated" || !session) {
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    return null;
  }

  return (
    <div className="h-screen w-screen flex bg-black text-white overflow-hidden selection:bg-emerald-500 selection:text-black">
      {/* Sidebar Navigation */}
      <aside
        className={`${
          collapsed ? "w-20" : "w-64"
        } h-full bg-neutral-950 border-r border-neutral-800/80 flex flex-col justify-between transition-all duration-300 z-40 select-none shrink-0`}
      >
        {/* Brand Header */}
        <div className="p-4 border-b border-neutral-800/80 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded-lg border border-emerald-500/40 bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-black text-sm shrink-0 shadow-lg shadow-emerald-500/20">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-black tracking-wider uppercase text-neutral-100 flex items-center gap-1.5">
                  dev-apply
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded font-mono">
                    PRO
                  </span>
                </span>
                <span className="text-[10px] text-neutral-500 font-mono">
                  {userRole === "CLIENT" ? "Client Operating System" : "SaaS Operating System"}
                </span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-900 transition-colors"
            title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {collapsed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              )}
            </svg>
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {navItems.map((group, idx) => (
            <div key={idx} className="space-y-2">
              {!collapsed && (
                <h3 className="px-3 text-[10px] font-bold text-neutral-500 tracking-widest uppercase">
                  {group.group}
                </h3>
              )}

              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs transition-all group relative ${
                        isActive
                          ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30 shadow-md shadow-emerald-500/5"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-900/80 font-medium"
                      }`}
                    >
                      <span className={`${isActive ? "text-emerald-400" : "text-neutral-400 group-hover:text-white"}`}>
                        {item.icon}
                      </span>

                      {!collapsed && <span className="truncate">{item.name}</span>}

                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full">
                          {item.badge}
                        </span>
                      )}

                      {/* Tooltip when collapsed */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2.5 py-1 bg-neutral-900 border border-neutral-800 text-white text-xs rounded-md shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                          {item.name}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Card Footer */}
        <div className="p-3 border-t border-neutral-800/80 bg-neutral-950">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/60">
            <div className="h-8 w-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
              {session.user.name?.charAt(0) || "U"}
            </div>

            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-neutral-100 truncate">{session.user.name}</p>
                <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {userRole === "CLIENT" ? "Client Role" : "Developer Role"}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main Area: Top Bar + Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <header className="h-16 border-b border-neutral-800/80 bg-neutral-950/80 backdrop-blur-md flex items-center justify-between px-6 z-30 shrink-0">
          {/* Breadcrumb & Section Title */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-neutral-500 font-mono hidden sm:inline">System</span>
            <span className="text-xs text-neutral-600 hidden sm:inline">/</span>
            <h1 className="text-sm font-extrabold text-white tracking-wide">{getPageTitle()}</h1>
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>All SaaS Services Operational</span>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs font-bold text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 px-3.5 py-1.5 rounded-lg transition-all"
            >
              Log Out
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 bg-black">
          {children}
        </main>
      </div>
    </div>
  );
}
