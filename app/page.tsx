"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Badge, Button, Card, EmptyState, ListRow } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

const STORAGE_KEY = "recipes";

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Saved recipe" : date.toLocaleDateString();
}

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const saved = readLocal<Recipe[]>(STORAGE_KEY, []);
    setRecipes(Array.isArray(saved) ? saved : []);
  }, []);

  function saveRecipes(nextRecipes: Recipe[]) {
    setRecipes(nextRecipes);
    writeLocal(STORAGE_KEY, nextRecipes);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (editingId) {
      saveRecipes(
        recipes.map((recipe) =>
          recipe.id === editingId ? { ...recipe, title: cleanTitle, notes: notes.trim() } : recipe,
        ),
      );
      setEditingId(null);
    } else {
      const recipe: Recipe = {
        id: createId(),
        title: cleanTitle,
        notes: notes.trim(),
        created_at: new Date().toISOString(),
      };
      saveRecipes([recipe, ...recipes]);
    }

    setTitle("");
    setNotes("");
  }

  function startEditing(recipe: Recipe) {
    setEditingId(recipe.id);
    setTitle(recipe.title);
    setNotes(recipe.notes);
  }

  function cancelEditing() {
    setEditingId(null);
    setTitle("");
    setNotes("");
  }

  function deleteRecipe(id: string) {
    saveRecipes(recipes.filter((recipe) => recipe.id !== id));
    if (editingId === id) cancelEditing();
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] px-4 py-8 text-[#e6e9ef] sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-start justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-[#4f8cff]">Student kitchen / 01</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Recipe collection</h1>
            <p className="mt-2 text-sm text-white/50">Keep practical meals and their notes in one place.</p>
          </div>
          <Link href="/settings" className="rounded-lg border border-white/15 px-3 py-2 text-sm text-white/70 hover:border-white/30 hover:text-white">
            Settings
          </Link>
        </header>

        <section aria-labelledby="recipe-form-heading" className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="recipe-form-heading" className="text-sm font-semibold">{editingId ? "Edit recipe" : "Add a recipe"}</h2>
            <Badge tone="brand">{recipes.length} saved</Badge>
          </div>
          <Card>
            <form onSubmit={handleSubmit} className="grid gap-4">
              <label className="grid gap-1.5 text-sm text-white/70">
                Recipe name
                <input
                  required
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="e.g. 15-minute tomato pasta"
                  className="h-10 rounded-lg border border-white/15 bg-[#0b0d10] px-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#4f8cff]"
                />
              </label>
              <label className="grid gap-1.5 text-sm text-white/70">
                Notes <span className="text-xs text-white/40">Ingredients, steps, or budget tips</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={3}
                  placeholder="Add a few useful details…"
                  className="resize-y rounded-lg border border-white/15 bg-[#0b0d10] px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-[#4f8cff]"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <Button type="submit">{editingId ? "Save changes" : "Add recipe"}</Button>
                {editingId ? <Button type="button" variant="secondary" onClick={cancelEditing}>Cancel</Button> : null}
              </div>
            </form>
          </Card>
        </section>

        <section aria-labelledby="saved-recipes-heading">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="saved-recipes-heading" className="text-sm font-semibold">Your recipes</h2>
            <span className="font-mono text-xs text-white/40">{String(recipes.length).padStart(2, "0")} records</span>
          </div>
          {recipes.length === 0 ? (
            <EmptyState
              title="No recipes saved yet"
              description="Add your first recipe above to start building a collection of easy meals."
              action={<span className="text-xs text-[#4f8cff]">Use the form to add a recipe</span>}
            />
          ) : (
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="p-3">
                  <ListRow
                    title={recipe.title}
                    subtitle={recipe.notes || `Added ${formatDate(recipe.created_at)}`}
                    trailing={
                      <div className="flex items-center gap-2">
                        <span className="hidden font-mono text-[10px] text-white/35 sm:inline">{formatDate(recipe.created_at)}</span>
                        <Button size="sm" variant="ghost" onClick={() => startEditing(recipe)} aria-label={`Edit ${recipe.title}`}>Edit</Button>
                        <Button size="sm" variant="danger" onClick={() => deleteRecipe(recipe.id)} aria-label={`Delete ${recipe.title}`}>Delete</Button>
                      </div>
                    }
                  />
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
