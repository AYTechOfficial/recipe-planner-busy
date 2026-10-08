"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

const STORAGE_KEY = "recipes";

function normalizeRecipes(value: unknown): Recipe[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === "object" && item !== null,
    )
    .map((item, index) => ({
      id: typeof item.id === "string" ? item.id : `recipe-${index}`,
      title: typeof item.title === "string" ? item.title : "Untitled recipe",
      notes: typeof item.notes === "string" ? item.notes : "",
      created_at:
        typeof item.created_at === "string"
          ? item.created_at
          : new Date(0).toISOString(),
    }));
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      setRecipes(normalizeRecipes(readLocal<unknown>(STORAGE_KEY, [])));
    } finally {
      setLoading(false);
    }
  }, []);

  function saveRecipes(nextRecipes: Recipe[]) {
    setRecipes(nextRecipes);
    writeLocal(STORAGE_KEY, nextRecipes);
  }

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

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setTitle("");
    setNotes("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (editingId) {
      saveRecipes(
        recipes.map((recipe) =>
          recipe.id === editingId
            ? { ...recipe, title: cleanTitle, notes: notes.trim() }
            : recipe,
        ),
      );
    } else {
      saveRecipes([
        {
          id: makeId(),
          title: cleanTitle,
          notes: notes.trim(),
          created_at: new Date().toISOString(),
        },
        ...recipes,
      ]);
    }

    closeForm();
  }

  function deleteRecipe(id: string) {
    saveRecipes(recipes.filter((recipe) => recipe.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e6e9ef]">
      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <header className="mb-10 flex items-center justify-between border-b border-white/10 pb-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Recipe planner home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#4f8cff]/15 font-mono text-lg text-[#4f8cff]">
              R
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-wide">RECIPE PLANNER</span>
              <span className="block font-mono text-[10px] tracking-[0.18em] text-white/40">STUDENT EDITION</span>
            </span>
          </Link>
          <Link
            href="/settings"
            className="rounded-lg border border-white/10 px-3 py-2 text-xs text-white/60 transition hover:border-white/25 hover:text-white"
          >
            Settings
          </Link>
        </header>

        <section className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-[#4f8cff]">Your collection</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Recipes</h1>
            <p className="mt-2 max-w-xl text-sm text-white/50">
              Keep your go-to meals in one place, ready for the next busy week.
            </p>
          </div>
          <Button onClick={openNewRecipe}>＋ Add a recipe</Button>
        </section>

        <Card className="mb-5 flex items-center justify-between gap-4 border-white/[0.08] bg-[#14171c]">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/40">Saved recipes</p>
            <p className="mt-1 font-mono text-2xl tabular-nums">{loading ? "··" : String(recipes.length).padStart(2, "0")}</p>
          </div>
          <Badge tone={loading ? "neutral" : recipes.length ? "brand" : "neutral"}>
            {loading ? "Loading" : recipes.length ? "Collection ready" : "No recipes yet"}
          </Badge>
        </Card>

        {formOpen && (
          <Card className="mb-5 border-[#4f8cff]/30 bg-[#14171c]">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold">{editingId ? "Edit recipe" : "Add a recipe"}</h2>
                <button type="button" onClick={closeForm} className="text-sm text-white/45 hover:text-white" aria-label="Close form">✕</button>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs text-white/60">Recipe name</span>
                <input
                  autoFocus
                  required
                  maxLength={120}
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. 15-minute tomato pasta"
                  className="w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm outline-none transition placeholder:text-white/25 focus:border-[#4f8cff]/60"
                />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs text-white/60">Notes <span className="text-white/35">(optional)</span></span>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Ingredients, steps, or anything you want to remember…"
                  className="w-full resize-y rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm outline-none transition placeholder:text-white/25 focus:border-[#4f8cff]/60"
                />
              </label>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={closeForm}>Cancel</Button>
                <Button type="submit">{editingId ? "Save changes" : "Save recipe"}</Button>
              </div>
            </form>
          </Card>
        )}

        {loading ? (
          <div className="rounded-xl border border-white/10 bg-[#14171c] px-5 py-12 text-center text-sm text-white/50" role="status">
            Loading your recipes…
          </div>
        ) : recipes.length === 0 ? (
          <EmptyState
            title="Your recipe collection is empty"
            message="Save a favorite meal or a quick idea so it is easy to find next time."
            icon={<span className="font-mono text-2xl">＋</span>}
            action={<Button onClick={openNewRecipe}>Add your first recipe</Button>}
          />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {recipes.map((recipe) => (
              <Card key={recipe.id} className="flex min-h-40 flex-col justify-between border-white/[0.08] bg-[#14171c]">
                <div className="min-w-0">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <h2 className="break-words text-base font-semibold">{recipe.title}</h2>
                    <Badge tone="brand">Saved</Badge>
                  </div>
                  {recipe.notes ? (
                    <p className="whitespace-pre-wrap break-words text-sm leading-6 text-white/55">{recipe.notes}</p>
                  ) : (
                    <p className="text-sm italic text-white/30">No notes added.</p>
                  )}
                </div>
                <div className="mt-5 flex items-center justify-between border-t border-white/[0.07] pt-3">
                  <span className="font-mono text-[10px] text-white/35">
                    {Number.isNaN(Date.parse(recipe.created_at))
                      ? "Saved recipe"
                      : new Date(recipe.created_at).toLocaleDateString()}
                  </span>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => openEditRecipe(recipe)}>Edit</Button>
                    <Button size="sm" variant="ghost" className="text-red-300/80 hover:bg-red-500/10 hover:text-red-200" onClick={() => deleteRecipe(recipe.id)}>Delete</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
