"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

const STORAGE_KEY = "recipe-planner-recipes";

export default function SettingsPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const saved = readLocal<Recipe[]>(STORAGE_KEY, []);
    setRecipes(Array.isArray(saved) ? saved : []);
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeLocal(STORAGE_KEY, recipes);
  }, [recipes, ready]);

  function clearRecipes() {
    if (recipes.length === 0) return;
    if (window.confirm("Delete all saved recipes? This cannot be undone.")) {
      setRecipes([]);
      setMessage("All recipes have been removed from this device.");
    }
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e6e9ef]">
      <div className="mx-auto max-w-4xl px-5 py-7 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Prepdesk home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4f8cff] text-lg font-bold text-[#0b0d10]">p</span>
            <span className="text-sm font-semibold tracking-wide">PREPDESK</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-white/55">
            <Link className="transition hover:text-white" href="/">Recipes</Link>
            <span className="text-white">Settings</span>
          </nav>
        </header>

        <div className="mt-9">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#4f8cff]">PREFERENCES & DATA</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-white/55">Manage your local recipe collection and how Prepdesk works on this device.</p>
        </div>

        <Card className="mt-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-semibold">Recipe collection</h2>
                <Badge tone="brand">ON THIS DEVICE</Badge>
              </div>
              <p className="mt-2 text-sm text-white/55">Your recipes are saved locally in this browser. They are not uploaded to an account or server.</p>
            </div>
            <div className="min-w-24 rounded-lg border border-white/10 bg-black/20 px-4 py-3 text-center">
              <p className="font-mono text-2xl font-semibold">{ready ? recipes.length : "··"}</p>
              <p className="mt-1 font-mono text-[10px] text-white/40">SAVED</p>
            </div>
          </div>
          {ready && recipes.length === 0 ? (
            <EmptyState className="mt-5" title="No recipes saved yet" description="Add a recipe from your collection and it will appear here." action={<Link href="/" className="inline-flex h-9 items-center rounded-lg bg-[#4f8cff] px-4 text-sm font-medium text-black">Go to recipes</Link>} />
          ) : ready ? (
            <div className="mt-5 space-y-2">
              {recipes.map((recipe) => (
                <div key={recipe.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm text-white/85">{recipe.title}</p>
                    <p className="font-mono text-[10px] text-white/40">{new Date(recipe.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="shrink-0 text-xs text-white/40">Saved locally</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-5 text-sm text-white/45">Loading saved recipes…</p>
          )}
          {message ? <p className="mt-4 text-sm text-emerald-300" role="status">{message}</p> : null}
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5">
            <p className="text-xs text-white/40">Removing recipes clears them from this browser.</p>
            <Button variant="danger" size="sm" disabled={!ready || recipes.length === 0} onClick={clearRecipes}>Delete all recipes</Button>
          </div>
        </Card>

        <Card className="mt-4">
          <h2 className="text-base font-semibold">Planning style</h2>
          <p className="mt-2 text-sm leading-6 text-white/55">Keep it simple: save the meals you already know, add quick notes, and build a personal list you can return to whenever you need an idea.</p>
        </Card>

        <div className="mt-6">
          <Link href="/" className="text-sm text-[#4f8cff] hover:underline">← Back to your recipes</Link>
        </div>
      </div>
    </main>
  );
}
