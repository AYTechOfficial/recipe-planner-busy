"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

const STORAGE_KEY = "recipe-planner-recipes";
const foodImages = [
  "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=1200&q=85",
  "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?auto=format&fit=crop&w=1200&q=85",
];

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ready, setReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const saved = readLocal<Recipe[]>(STORAGE_KEY, []);
    setRecipes(Array.isArray(saved) ? saved : []);
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
      setRecipes((current) => current.map((recipe) => recipe.id === editingId
        ? { ...recipe, title: cleanTitle, notes: notes.trim() }
        : recipe));
    } else {
      const recipe: Recipe = {
        id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        title: cleanTitle,
        notes: notes.trim(),
        created_at: new Date().toISOString(),
      };
      setRecipes((current) => [recipe, ...current]);
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
      <div className="mx-auto max-w-6xl px-5 py-7 sm:px-8">
        <header className="flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Prepdesk home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4f8cff] text-lg font-bold text-[#0b0d10]">p</span>
            <span className="text-sm font-semibold tracking-wide">PREPDESK</span>
          </Link>
          <nav className="flex items-center gap-5 text-sm text-white/55">
            <span className="text-white">Recipes</span>
            <Link className="transition hover:text-white" href="/settings">Settings</Link>
          </nav>
        </header>

        <section className="relative mt-7 min-h-[260px] overflow-hidden rounded-2xl border border-white/10 bg-[#14171c] sm:min-h-[300px]">
          <img
            src="https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=1800&q=85"
            alt="A fresh, colorful bowl of vegetables and grains"
            className="absolute inset-0 h-full w-full object-cover opacity-35"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0d10] via-[#0b0d10]/80 to-[#0b0d10]/15" />
          <div className="relative flex min-h-[260px] flex-col justify-center p-7 sm:min-h-[300px] sm:p-10">
            <Badge tone="brand" className="w-fit">YOUR STUDENT KITCHEN</Badge>
            <h1 className="mt-4 max-w-xl text-3xl font-semibold tracking-tight sm:text-5xl">Good food, less figuring it out.</h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/65 sm:text-base">Keep your go-to meals in one place. Save the recipes you can make between classes, on a budget, and with whatever is in the fridge.</p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <Button onClick={openNewRecipe} size="md">＋ Add a recipe</Button>
              <span className="font-mono text-xs text-white/55">{ready ? String(recipes.length).padStart(2, "0") : "··"} SAVED RECIPES</span>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#4f8cff]">YOUR COLLECTION</p>
              <h2 className="mt-1 text-xl font-semibold">Recipes</h2>
            </div>
            {ready && recipes.length > 0 ? <p className="font-mono text-xs text-white/40">{recipes.length} {recipes.length === 1 ? "ITEM" : "ITEMS"}</p> : null}
          </div>

          {!ready ? (
            <div className="rounded-xl border border-white/10 bg-[#14171c] px-5 py-10 text-center text-sm text-white/50">Loading your recipes…</div>
          ) : recipes.length === 0 ? (
            <EmptyState
              title="Your recipe collection is empty"
              description="Save a favorite meal, a quick lunch, or something you want to try. It will be here next time you open Prepdesk."
              icon={<span className="text-3xl" aria-hidden="true">🥗</span>}
              action={<Button onClick={openNewRecipe}>Add your first recipe</Button>}
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe, index) => (
                <Card key={recipe.id} className="overflow-hidden !p-0">
                  <div className="relative h-40 overflow-hidden bg-[#20252d]">
                    <img src={foodImages[index % foodImages.length]} alt="A meal idea" className="h-full w-full object-cover" />
                    <span className="absolute left-3 top-3"><Badge tone="neutral">RECIPE {String(index + 1).padStart(2, "0")}</Badge></span>
                  </div>
                  <div className="p-4">
                    <h3 className="truncate text-base font-semibold">{recipe.title}</h3>
                    <p className="mt-2 min-h-10 whitespace-pre-wrap break-words text-sm leading-5 text-white/55">{recipe.notes || "No notes yet. Edit this recipe to add ingredients or a reminder."}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-white/10 pt-3">
                      <span className="font-mono text-[10px] text-white/35">{new Date(recipe.created_at).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditRecipe(recipe)} aria-label={`Edit ${recipe.title}`}>Edit</Button>
                        <Button variant="ghost" size="sm" className="text-red-300 hover:text-red-200" onClick={() => deleteRecipe(recipe.id)} aria-label={`Delete ${recipe.title}`}>Delete</Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        {formOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}>
            <Card className="w-full max-w-lg !p-0 shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="recipe-form-title">
              <form onSubmit={saveRecipe}>
                <div className="flex items-start justify-between border-b border-white/10 p-5">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#4f8cff]">RECIPE NOTE</p>
                    <h2 id="recipe-form-title" className="mt-1 text-lg font-semibold">{editingId ? "Edit recipe" : "Add a recipe"}</h2>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)} aria-label="Close form">✕</Button>
                </div>
                <div className="space-y-4 p-5">
                  <label className="block text-sm text-white/75">
                    Recipe name <span className="text-red-300">*</span>
                    <input autoFocus required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. 15-minute tomato pasta" className="mt-2 h-11 w-full rounded-lg border border-white/15 bg-[#0b0d10] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#4f8cff]" />
                  </label>
                  <label className="block text-sm text-white/75">
                    Ingredients, steps, or notes
                    <textarea maxLength={2000} rows={5} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="What do you need? Any shortcuts to remember?" className="mt-2 w-full resize-y rounded-lg border border-white/15 bg-[#0b0d10] px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#4f8cff]" />
                  </label>
                </div>
                <div className="flex justify-end gap-2 border-t border-white/10 p-5">
                  <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
                  <Button type="submit">{editingId ? "Save changes" : "Save recipe"}</Button>
                </div>
              </form>
            </Card>
          </div>
        ) : null}
      </div>
    </main>
  );
}
