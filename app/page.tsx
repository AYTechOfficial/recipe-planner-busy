"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { readLocal, writeLocal } from "@/lib/persist";

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

const STORAGE_KEY = "recipe-planner-items";
const foodImages = [
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=900&q=85",
  "https://images.unsplash.com/photo-1512621776951-a57141f2e7b2?auto=format&fit=crop&w=900&q=85",
];

function imageFor(recipe: Recipe, index: number) {
  const hash = recipe.title.split("").reduce((total, character) => total + character.charCodeAt(0), 0);
  return foodImages[(hash + index) % foodImages.length];
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ready, setReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setRecipes(readLocal<Recipe[]>(STORAGE_KEY, []));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeLocal(STORAGE_KEY, recipes);
  }, [recipes, ready]);

  function openNewRecipe() {
    setEditingId(null);
    setTitle("");
    setNotes("");
    setFormOpen(true);
  }

  function openEditRecipe(recipe: Recipe) {
    setEditingId(recipe.id);
    setTitle(recipe.title);
    setNotes(recipe.notes);
    setFormOpen(true);
  }

  function saveRecipe(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (editingId) {
      setRecipes((current) => current.map((recipe) =>
        recipe.id === editingId ? { ...recipe, title: cleanTitle, notes: notes.trim() } : recipe,
      ));
    } else {
      const id = typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      setRecipes((current) => [{ id, title: cleanTitle, notes: notes.trim(), created_at: new Date().toISOString() }, ...current]);
    }
    setFormOpen(false);
    setEditingId(null);
    setTitle("");
    setNotes("");
  }

  function deleteRecipe(id: string) {
    setRecipes((current) => current.filter((recipe) => recipe.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e6e9ef]">
      <header className="border-b border-white/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="Pantry home">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#4f8cff]/15 text-lg text-[#78a7ff]">✳</span>
            <span className="text-sm font-semibold tracking-wide">pantry<span className="text-[#4f8cff]">/</span>plan</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-white/55">
            <span className="text-white/85">My recipes</span>
            <Link href="/settings" className="transition hover:text-white">Settings</Link>
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 pb-16 pt-8 sm:px-8 sm:pt-12">
        <section className="relative mb-10 min-h-[280px] overflow-hidden rounded-2xl border border-white/10 bg-[#14171c] sm:min-h-[340px]">
          <img
            src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1800&q=90"
            alt="A colorful spread of fresh ingredients and prepared food"
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d10]/95 via-[#0b0d10]/75 to-[#0b0d10]/15" />
          <div className="relative flex min-h-[280px] flex-col items-start justify-center p-7 sm:min-h-[340px] sm:p-12">
            <p className="mb-4 font-mono text-[11px] uppercase tracking-[0.22em] text-[#9abaff]">Good food, less guesswork</p>
            <h1 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">Your week, made<br className="hidden sm:block" /> a little more delicious.</h1>
            <p className="mt-4 max-w-md text-sm leading-6 text-white/65 sm:text-base">Keep the recipes you love in one place and make busy student meals easier to plan.</p>
            <button type="button" onClick={openNewRecipe} className="mt-7 inline-flex h-11 items-center gap-2 rounded-lg bg-[#4f8cff] px-5 text-sm font-semibold text-[#07101f] transition hover:bg-[#76a5ff]">
              <span className="text-lg leading-none">+</span> Add a recipe
            </button>
          </div>
          <div className="absolute bottom-5 right-5 hidden rounded-lg border border-white/15 bg-black/35 px-3 py-2 font-mono text-[10px] tracking-wider text-white/70 backdrop-blur-sm sm:block">PLAN · PREP · ENJOY</div>
        </section>

        <section aria-labelledby="recipe-heading">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/40">Your collection</p>
              <h2 id="recipe-heading" className="mt-1 text-xl font-semibold">Saved recipes <span className="ml-1 font-mono text-sm font-normal text-white/35">{recipes.length.toString().padStart(2, "0")}</span></h2>
            </div>
            {recipes.length > 0 && <button type="button" onClick={openNewRecipe} className="rounded-lg border border-white/15 px-3 py-2 text-xs text-white/75 transition hover:border-white/30 hover:text-white">+ New recipe</button>}
          </div>

          {!ready ? (
            <div className="rounded-xl border border-white/10 bg-[#14171c] p-8 text-sm text-white/45">Loading your recipes…</div>
          ) : recipes.length === 0 ? (
            <div className="grid overflow-hidden rounded-2xl border border-white/10 bg-[#14171c] md:grid-cols-[1fr_0.8fr]">
              <div className="flex flex-col items-start justify-center p-7 sm:p-10">
                <span className="mb-4 rounded-full border border-[#4f8cff]/30 bg-[#4f8cff]/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-[#8db3ff]">Start your collection</span>
                <h3 className="text-2xl font-semibold">What do you love to eat?</h3>
                <p className="mt-3 max-w-md text-sm leading-6 text-white/50">Add a favorite meal, a quick lunch, or something you want to try. Your recipes stay saved on this device.</p>
                <button type="button" onClick={openNewRecipe} className="mt-6 rounded-lg bg-[#4f8cff] px-4 py-2.5 text-sm font-semibold text-[#07101f] transition hover:bg-[#76a5ff]">Add your first recipe <span aria-hidden="true">→</span></button>
              </div>
              <div className="relative min-h-[220px] md:min-h-[300px]">
                <img src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1000&q=85" alt="Fresh salad bowl with colorful vegetables" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#14171c]/60 to-transparent" />
                <span className="absolute bottom-4 left-4 rounded-md border border-white/20 bg-black/35 px-3 py-1.5 font-mono text-[10px] text-white/80 backdrop-blur-sm">FRESH IDEAS START HERE</span>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe, index) => (
                <article key={recipe.id} className="group overflow-hidden rounded-xl border border-white/10 bg-[#14171c] transition hover:border-white/20">
                  <div className="relative h-44 overflow-hidden">
                    <img src={imageFor(recipe, index)} alt={`Food inspiration for ${recipe.title}`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-black/10" />
                    <span className="absolute bottom-3 left-3 rounded-md border border-white/20 bg-black/35 px-2 py-1 font-mono text-[10px] text-white/80 backdrop-blur-sm">RECIPE · {String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate text-base font-semibold">{recipe.title}</h3>
                    <p className="mt-2 min-h-[40px] whitespace-pre-wrap text-sm leading-5 text-white/50">{recipe.notes || "No notes yet. Add ingredients or a quick reminder."}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/[0.08] pt-3">
                      <span className="font-mono text-[10px] text-white/35">{recipe.created_at ? new Date(recipe.created_at).toLocaleDateString() : "Saved recipe"}</span>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => openEditRecipe(recipe)} className="rounded-md px-2.5 py-1.5 text-xs text-white/60 transition hover:bg-white/10 hover:text-white">Edit</button>
                        <button type="button" onClick={() => deleteRecipe(recipe.id)} className="rounded-md px-2.5 py-1.5 text-xs text-white/45 transition hover:bg-red-500/10 hover:text-red-300">Delete</button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
        <p className="mt-10 text-center font-mono text-[10px] tracking-wide text-white/25">YOUR RECIPES ARE STORED LOCALLY ON THIS DEVICE</p>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}>
          <form onSubmit={saveRecipe} className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#14171c] p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#83aaff]">Recipe notebook</p>
                <h2 className="mt-2 text-xl font-semibold">{editingId ? "Edit recipe" : "Add a recipe"}</h2>
              </div>
              <button type="button" onClick={() => setFormOpen(false)} aria-label="Close form" className="rounded-md px-2 py-1 text-xl leading-none text-white/45 hover:bg-white/10 hover:text-white">×</button>
            </div>
            <label htmlFor="recipe-title" className="mb-2 block text-xs font-medium text-white/65">Recipe name</label>
            <input id="recipe-title" autoFocus required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. 15-minute pesto pasta" className="mb-5 h-11 w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#4f8cff]/70" />
            <label htmlFor="recipe-notes" className="mb-2 block text-xs font-medium text-white/65">Ingredients, steps, or notes <span className="font-normal text-white/35">(optional)</span></label>
            <textarea id="recipe-notes" rows={5} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What you'll need, how to make it, or anything to remember…" className="w-full resize-y rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-3 text-sm leading-6 text-white outline-none placeholder:text-white/25 focus:border-[#4f8cff]/70" />
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setFormOpen(false)} className="rounded-lg px-4 py-2.5 text-sm text-white/60 transition hover:bg-white/5 hover:text-white">Cancel</button>
              <button type="submit" className="rounded-lg bg-[#4f8cff] px-5 py-2.5 text-sm font-semibold text-[#07101f] transition hover:bg-[#76a5ff]">{editingId ? "Save changes" : "Save recipe"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
