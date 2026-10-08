"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Badge, Button, Card, EmptyState, ListRow } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";
import { PLANNER_KEY, RECIPE_KEY, type Planner, type Recipe } from "@/lib/recipe-data";

const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

type PageData = {
  ready: boolean;
  recipes: Recipe[];
  planner: Planner;
};

function makeId() {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function HomePage() {
  const [data, setData] = useState<PageData>({ ready: false, recipes: [], planner: {} });
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const savedRecipes = readLocal<Recipe[]>(RECIPE_KEY, []);
    const savedPlanner = readLocal<Planner>(PLANNER_KEY, {});
    setData({
      ready: true,
      recipes: Array.isArray(savedRecipes) ? savedRecipes : [],
      planner: savedPlanner && typeof savedPlanner === "object" ? savedPlanner : {},
    });
  }, []);

  useEffect(() => {
    if (!data.ready) return;
    writeLocal(RECIPE_KEY, data.recipes);
    writeLocal(PLANNER_KEY, data.planner);
  }, [data]);

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
      setData((current) => ({
        ...current,
        recipes: current.recipes.map((recipe) =>
          recipe.id === editingId ? { ...recipe, title: cleanTitle, notes: notes.trim() } : recipe,
        ),
      }));
    } else {
      const recipe: Recipe = {
        id: makeId(),
        title: cleanTitle,
        notes: notes.trim(),
        created_at: new Date().toISOString(),
      };
      setData((current) => ({ ...current, recipes: [recipe, ...current.recipes] }));
    }

    setFormOpen(false);
    setEditingId(null);
    setTitle("");
    setNotes("");
  }

  function deleteRecipe(recipe: Recipe) {
    if (!window.confirm(`Delete “${recipe.title}”?`)) return;
    setData((current) => {
      const planner = { ...current.planner };
      for (const day of weekdays) {
        if (planner[day] === recipe.id) delete planner[day];
      }
      return {
        ...current,
        recipes: current.recipes.filter((item) => item.id !== recipe.id),
        planner,
      };
    });
  }

  function assignRecipe(day: string, recipeId: string) {
    setData((current) => {
      const planner = { ...current.planner };
      if (recipeId) planner[day] = recipeId;
      else delete planner[day];
      return { ...current, planner };
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-8 text-[var(--primary)] sm:px-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Student kitchen / planner</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Your recipes</h1>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/" className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5">Recipes</Link>
          <Link href="/settings" className="rounded-lg px-3 py-2 text-sm text-white/55 hover:bg-white/5 hover:text-white">Settings</Link>
        </nav>
      </header>

      <section className="mb-10">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-white/40">WEEK AT A GLANCE</p>
            <h2 className="mt-1 text-lg font-semibold">Meal plan</h2>
          </div>
          <Badge tone="neutral">{data.recipes.length} {data.recipes.length === 1 ? "recipe" : "recipes"}</Badge>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {weekdays.map((day) => {
            const plannedRecipe = data.recipes.find((recipe) => recipe.id === data.planner[day]);
            return (
              <Card key={day} className="min-h-32 p-3">
                <p className="font-mono text-xs uppercase tracking-wide text-white/45">{day}</p>
                {plannedRecipe ? (
                  <div className="mt-3">
                    <p className="text-sm font-medium">{plannedRecipe.title}</p>
                    <button type="button" onClick={() => assignRecipe(day, "")} className="mt-2 text-xs text-white/45 underline underline-offset-2 hover:text-white">Remove from plan</button>
                  </div>
                ) : data.recipes.length ? (
                  <select
                    aria-label={`Recipe for ${day}`}
                    value=""
                    onChange={(event) => assignRecipe(day, event.target.value)}
                    className="mt-3 w-full rounded-md border border-white/10 bg-[#0b0d10] px-2 py-2 text-xs text-white/65 outline-none focus:border-[var(--accent)]"
                  >
                    <option value="">Add a recipe…</option>
                    {data.recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}
                  </select>
                ) : (
                  <p className="mt-3 text-xs text-white/35">No recipe planned</p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs text-white/40">YOUR COLLECTION</p>
            <h2 className="mt-1 text-lg font-semibold">Recipe library</h2>
          </div>
          <Button onClick={openNewRecipe}>＋ Add a recipe</Button>
        </div>

        {formOpen && (
          <Card className="mb-5">
            <form onSubmit={saveRecipe} className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-medium">{editingId ? "Edit recipe" : "New recipe"}</h3>
                <button type="button" onClick={() => setFormOpen(false)} className="text-sm text-white/45 hover:text-white">Close</button>
              </div>
              <label className="block space-y-1.5">
                <span className="text-xs text-white/60">Recipe name</span>
                <input autoFocus required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. 15-minute pesto pasta" className="w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
              </label>
              <label className="block space-y-1.5">
                <span className="text-xs text-white/60">Notes or ingredients</span>
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={1000} placeholder="Add ingredients, steps, or a reminder…" className="w-full resize-y rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm outline-none focus:border-[var(--accent)]" />
              </label>
              <div className="flex gap-2">
                <Button type="submit">{editingId ? "Save changes" : "Save recipe"}</Button>
                <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
              </div>
            </form>
          </Card>
        )}

        {data.recipes.length === 0 ? (
          <EmptyState
            title="Your recipe collection is empty"
            message="Save the meals you like to make. You can add ingredients or cooking notes and plan them by day."
            action={<Button onClick={openNewRecipe}>Add your first recipe</Button>}
          />
        ) : (
          <div className="space-y-2">
            {data.recipes.map((recipe) => (
              <Card key={recipe.id} className="p-3">
                <ListRow
                  title={recipe.title}
                  subtitle={recipe.notes || `Added ${new Date(recipe.created_at).toLocaleDateString()}`}
                  trailing={
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEditRecipe(recipe)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => deleteRecipe(recipe)}>Delete</Button>
                    </div>
                  }
                />
              </Card>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
