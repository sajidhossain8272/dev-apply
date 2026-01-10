"use client";

import React, { useState, useRef, useEffect } from "react";

interface CLIProps {
    onCommand: (cmd: string) => Promise<string>;
}

export function PortfolioCLI({ onCommand }: CLIProps) {
    const [history, setHistory] = useState<string[]>(["WELCOME TO DEV-APPLY COMMAND INTERFACE", "TYPE 'HELP' FOR AVAILABLE COMMANDS"]);
    const [input, setInput] = useState("");
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [history]);

    const handleKeyDown = async (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && input.trim()) {
            const cmd = input.trim();
            setHistory((prev) => [...prev, `> ${cmd}`]);
            setInput("");

            const response = await onCommand(cmd);
            setHistory((prev) => [...prev, response]);
        }
    };

    return (
        <div className="w-full bg-black border border-neutral-900 font-mono text-[10px] uppercase tracking-widest text-neutral-400">
            <div className="p-2 border-b border-neutral-900 bg-neutral-950 flex items-center justify-between">
                <span>DEV-APPLY SHELL v1.0.4</span>
                <div className="flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-neutral-800" />
                    <div className="w-2 h-2 rounded-full bg-neutral-800" />
                </div>
            </div>
            <div
                ref={scrollRef}
                className="h-48 overflow-y-auto p-4 space-y-1 bg-black scrollbar-hide"
            >
                {history.map((line, i) => (
                    <div key={i} className={line.startsWith(">") ? "text-white font-bold" : ""}>
                        {line}
                    </div>
                ))}
            </div>
            <div className="p-4 border-t border-neutral-900 flex items-center gap-2">
                <span className="text-white font-bold">$</span>
                <input
                    className="flex-1 bg-transparent outline-none text-white w-full"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    autoFocus
                    spellCheck={false}
                />
            </div>
        </div>
    );
}
