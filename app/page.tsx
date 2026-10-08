"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

const RECIPES_KEY = "campus-recipes-v1";

function isRecipe(value: unknown): value is Recipe {
  if (typeof value !== "object" || value === null) return false;
  const recipe = value as Record<string, unknown>;
  return typeof recipe.id === "string" && typeof recipe.title === "string" && typeof recipe.notes === "string" && typeof recipe.created_at === "string";
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Saved recipe";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date);
}

function recipeId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID();
  return `recipe-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState("");
  const [editor, setEditor] = useState<Recipe | "new" | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const stored = readLocal<unknown>(RECIPES_KEY, []);
    setRecipes(Array.isArray(stored) ? stored.filter(isRecipe) : []);
    setReady(true);
  }, []);

  const visibleRecipes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return recipes;
    return recipes.filter((recipe) => `${recipe.title} ${recipe.notes}`.toLowerCase().includes(normalizedQuery));
  }, [query, recipes]);

  function saveRecipes(next: Recipe[]) {
    setRecipes(next);
    writeLocal(RECIPES_KEY, next);
  }

  function openNewRecipe() {
    setTitle("");
    setNotes("");
    setEditor("new");
  }

  function openEditRecipe(recipe: Recipe) {
    setTitle(recipe.title);
    setNotes(recipe.notes);
    setEditor(recipe);
  }

  function saveRecipe() {
    const cleanTitle = title.trim();
    if (!cleanTitle || !ready) return;
    if (editor === "new") {
      saveRecipes([{ id: recipeId(), title: cleanTitle, notes: notes.trim(), created_at: new Date().toISOString() }, ...recipes]);
    } else if (editor) {
      saveRecipes(recipes.map((recipe) => recipe.id === editor.id ? { ...recipe, title: cleanTitle, notes: notes.trim() } : recipe));
    }
    setEditor(null);
  }

  function deleteRecipe(recipe: Recipe) {
    if (!window.confirm(`Delete “${recipe.title}”? This cannot be undone.`)) return;
    saveRecipes(recipes.filter((item) => item.id !== recipe.id));
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e6e9ef]">
      <div className="mx-auto max-w-6xl px-5 pb-16 pt-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Campus Kitchen home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#4f8cff]/30 bg-[#4f8cff]/10 text-[#77a8ff]">
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M4 12h16M6 12a6 6 0 0 1 12 0M7 16h10M9 19h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M12 3v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg>
            </span>
            <span><span className="block text-sm font-semibold tracking-wide">CAMPUS KITCHEN</span><span className="block text-[11px] text-white/40">A little more planned. A lot less stressed.</span></span>
          </Link>
          <nav className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#14171c] p-1 text-sm" aria-label="Main navigation">
            <Link href="/" aria-current="page" className="rounded-md bg-white/10 px-3 py-2 text-white">My recipes</Link>
            <Link href="/settings" className="rounded-md px-3 py-2 text-white/55 transition hover:bg-white/5 hover:text-white">Settings</Link>
          </nav>
        </header>

        <section className="grid gap-7 pb-9 pt-9 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2"><Badge tone="brand">YOUR COOKBOOK</Badge><span className="font-mono text-[11px] text-white/35">LOCAL • PRIVATE</span></div>
            <h1 className="max-w-2xl text-3xl font-semibold tracking-tight sm:text-4xl">Good food, without the guesswork.</h1>
            <p className="mt-3 max-w-xl text-sm leading-6 text-white/55">Keep the recipes that fit student life close at hand. Save quick meals, jot down ingredients, and make busy weeks easier.</p>
          </div>
          <Button size="lg" onClick={openNewRecipe} disabled={!ready} className="w-full sm:w-auto"><span className="text-lg leading-none">+</span> Add a recipe</Button>
        </section>

        <section className="grid grid-cols-2 gap-3 sm:max-w-lg" aria-label="Recipe collection overview">
          <Card className="border-white/[0.07] bg-[#14171c] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Recipes saved</p>
            <p className="mt-2 font-mono text-2xl text-white">{ready ? String(recipes.length).padStart(2, "0") : "··"}</p>
          </Card>
          <Card className="border-white/[0.07] bg-[#14171c] p-4">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Collection status</p>
            <p className="mt-2 flex items-center gap-2 text-sm text-white/80"><span className={`h-2 w-2 rounded-full ${ready ? "bg-emerald-400" : "bg-amber-400"}`} />{ready ? "Up to date" : "Loading collection"}</p>
          </Card>
        </section>

        <section className="mt-10" aria-labelledby="recipes-heading">
          <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4f8cff]">THE GOOD STUFF</p><h2 id="recipes-heading" className="mt-1 text-xl font-semibold">Your recipes <span className="ml-1 font-mono text-sm font-normal text-white/35">({recipes.length})</span></h2></div>
            <label className="relative block w-full sm:max-w-xs">
              <span className="sr-only">Search recipes</span>
              <svg viewBox="0 0 24 24" fill="none" className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" aria-hidden="true"><circle cx="10.8" cy="10.8" r="6.3" stroke="currentColor" strokeWidth="1.6"/><path d="m15.5 15.5 4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes or ingredients" className="h-10 w-full rounded-lg border border-white/10 bg-[#14171c] pl-9 pr-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#4f8cff]/60" />
            </label>
          </div>

          {!ready ? <div className="rounded-xl border border-white/10 bg-[#14171c] px-5 py-12 text-center text-sm text-white/45">Loading your recipes…</div> : recipes.length === 0 ? (
            <EmptyState title="Your cookbook starts here" message="Save a favorite, a five-minute lunch, or that recipe you keep meaning to try." icon={<span className="text-2xl">✳</span>} action={<Button onClick={openNewRecipe}>Add your first recipe</Button>} />
          ) : visibleRecipes.length === 0 ? (
            <EmptyState title="No recipes match that search" message="Try another ingredient or clear your search to see everything." action={<Button variant="secondary" onClick={() => setQuery("")}>Clear search</Button>} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {visibleRecipes.map((recipe) => (
                <Card key={recipe.id} className="group border-white/[0.08] bg-[#14171c] p-0 transition hover:border-white/20">
                  <article className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0"><p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-white/35">{formatDate(recipe.created_at)}</p><h3 className="break-words text-lg font-medium text-white">{recipe.title}</h3></div>
                      <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#4f8cff]/10 text-[#77a8ff]" aria-hidden="true">✳</span>
                    </div>
                    {recipe.notes ? <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-6 text-white/55">{recipe.notes}</p> : <p className="mt-3 text-sm italic text-white/30">No ingredients or notes added yet.</p>}
                    <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-3">
                      <span className="truncate font-mono text-[10px] text-white/25">ID · {recipe.id.slice(0, 8)}</span>
                      <div className="flex gap-1"><Button size="sm" variant="ghost" onClick={() => openEditRecipe(recipe)} aria-label={`Edit ${recipe.title}`}>Edit</Button><Button size="sm" variant="ghost" className="text-red-300/75 hover:bg-red-400/10 hover:text-red-200" onClick={() => deleteRecipe(recipe)} aria-label={`Delete ${recipe.title}`}>Delete</Button></div>
                    </div>
                  </article>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {editor !== null ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditor(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="editor-title" className="my-auto w-full max-w-lg rounded-2xl border border-white/10 bg-[#14171c] p-5 shadow-2xl sm:p-6">
            <div className="mb-5 flex items-start justify-between gap-4"><div><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#4f8cff]">RECIPE ENTRY</p><h2 id="editor-title" className="mt-1 text-xl font-semibold">{editor === "new" ? "Add a recipe" : "Edit recipe"}</h2></div><Button size="sm" variant="ghost" onClick={() => setEditor(null)} aria-label="Close editor">✕</Button></div>
            <div className="space-y-4">
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-white/70">Recipe name <span className="text-red-300">*</span></span><input autoFocus maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); saveRecipe(); } }} placeholder="e.g. Peanut butter banana oats" className="h-11 w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#4f8cff]/60" /></label>
              <label className="block"><span className="mb-1.5 block text-xs font-medium text-white/70">Ingredients, steps, or notes</span><textarea maxLength={2000} rows={6} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What do you need? How do you make it? Add any shortcuts that make it work for you." className="w-full resize-y rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm leading-6 text-white outline-none placeholder:text-white/30 focus:border-[#4f8cff]/60" /><span className="mt-1 block text-right font-mono text-[10px] text-white/30">{notes.length}/2000</span></label>
              <div className="flex justify-end gap-2 border-t border-white/[0.07] pt-4"><Button variant="secondary" onClick={() => setEditor(null)}>Cancel</Button><Button onClick={saveRecipe} disabled={!title.trim()}>{editor === "new" ? "Save recipe" : "Save changes"}</Button></div>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}
