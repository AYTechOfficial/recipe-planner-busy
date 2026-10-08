"use client";

import { useEffect, useState } from "react";
import { Badge, Button, Card, EmptyState, ListRow } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

type MealPlan = Record<string, string>;

const recipeKey = "recipes";
const planKey = "mealPlan";
const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [ready, setReady] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const storedRecipes = readLocal<Recipe[]>(recipeKey, []);
    const storedPlan = readLocal<MealPlan>(planKey, {});
    setRecipes(Array.isArray(storedRecipes) ? storedRecipes : []);
    setMealPlan(storedPlan && typeof storedPlan === "object" ? storedPlan : {});
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeLocal(recipeKey, recipes);
  }, [ready, recipes]);

  useEffect(() => {
    if (ready) writeLocal(planKey, mealPlan);
  }, [ready, mealPlan]);

  function openNewRecipe() {
    setEditingId(null);
    setTitle("");
    setNotes("");
    setFormOpen(true);
  }

  function editRecipe(recipe: Recipe) {
    setEditingId(recipe.id);
    setTitle(recipe.title);
    setNotes(recipe.notes);
    setFormOpen(true);
  }

  function saveRecipe() {
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    if (editingId) {
      setRecipes((current) => current.map((recipe) => recipe.id === editingId
        ? { ...recipe, title: cleanTitle, notes: notes.trim() }
        : recipe));
    } else {
      setRecipes((current) => [{
        id: makeId(),
        title: cleanTitle,
        notes: notes.trim(),
        created_at: new Date().toISOString(),
      }, ...current]);
    }

    setFormOpen(false);
    setEditingId(null);
    setTitle("");
    setNotes("");
  }

  function deleteRecipe(id: string) {
    setRecipes((current) => current.filter((recipe) => recipe.id !== id));
    setMealPlan((current) => Object.fromEntries(Object.entries(current).filter(([, recipeId]) => recipeId !== id)));
  }

  function assignRecipe(day: string, recipeId: string) {
    setMealPlan((current) => {
      const next = { ...current };
      if (recipeId) next[day] = recipeId;
      else delete next[day];
      return next;
    });
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 py-8 text-[var(--primary)] sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Student kitchen / 01</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Recipe planner</h1>
          <p className="mt-1 text-sm text-white/50">Keep your go-to meals close and plan the week ahead.</p>
        </div>
        <nav className="flex items-center gap-2">
          <a className="rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white" href="/settings">Settings</a>
          <Button onClick={openNewRecipe}>＋ Add a recipe</Button>
        </nav>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <section aria-labelledby="collection-heading">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">Library</p>
              <h2 id="collection-heading" className="mt-1 text-lg font-semibold">Recipe collection</h2>
            </div>
            <Badge tone="brand">{recipes.length} {recipes.length === 1 ? "recipe" : "recipes"}</Badge>
          </div>

          {formOpen && (
            <Card className="mb-4 border-[var(--accent)]/30">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-medium">{editingId ? "Edit recipe" : "New recipe"}</h3>
                <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Close</Button>
              </div>
              <form onSubmit={(event) => { event.preventDefault(); saveRecipe(); }} className="space-y-3">
                <label className="block text-xs font-medium text-white/60">
                  Recipe name
                  <input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} maxLength={100} required placeholder="e.g. Tomato chickpea pasta" className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)]" />
                </label>
                <label className="block text-xs font-medium text-white/60">
                  Notes / ingredients
                  <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} maxLength={2000} placeholder="Ingredients, steps, or anything to remember" className="mt-1.5 w-full resize-y rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)]" />
                </label>
                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
                  <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-[var(--accent)] px-4 text-sm font-medium text-black hover:opacity-90">{editingId ? "Save changes" : "Save recipe"}</button>
                </div>
              </form>
            </Card>
          )}

          {!ready ? (
            <Card className="text-sm text-white/50">Loading your recipes…</Card>
          ) : recipes.length === 0 ? (
            <EmptyState title="Your collection is empty" message="Add a recipe to keep your favorite quick meals in one place." action={<Button onClick={openNewRecipe}>＋ Add your first recipe</Button>} />
          ) : (
            <div className="space-y-2">
              {recipes.map((recipe) => (
                <Card key={recipe.id} className="p-3">
                  <ListRow title={recipe.title} subtitle={recipe.notes || `Added ${new Date(recipe.created_at).toLocaleDateString()}`} trailing={<span className="font-mono text-[10px] text-white/30">{recipe.id.slice(0, 8)}</span>} />
                  <div className="mt-2 flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => editRecipe(recipe)}>Edit</Button>
                    <Button size="sm" variant="danger" onClick={() => deleteRecipe(recipe.id)}>Delete</Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="planner-heading">
          <div className="mb-4">
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/40">Weekly view</p>
            <h2 id="planner-heading" className="mt-1 text-lg font-semibold">This week</h2>
          </div>
          <Card className="space-y-2">
            {weekdays.map((day) => {
              const selectedRecipe = recipes.find((recipe) => recipe.id === mealPlan[day]);
              return (
                <div key={day} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] py-2 last:border-0">
                  <span className="w-24 text-sm text-white/70">{day}</span>
                  {ready ? (
                    <select aria-label={`${day} meal`} value={mealPlan[day] ?? ""} onChange={(event) => assignRecipe(day, event.target.value)} className="min-w-0 flex-1 rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2 text-sm text-white outline-none focus:border-[var(--accent)]">
                      <option value="">{recipes.length ? "Choose a recipe…" : "Add recipes to plan meals"}</option>
                      {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}
                    </select>
                  ) : <span className="text-xs text-white/40">Loading…</span>}
                  {selectedRecipe && <Badge tone="pass">Planned</Badge>}
                </div>
              );
            })}
          </Card>
          <p className="mt-3 text-xs text-white/40">Your plan is saved on this device.</p>
        </section>
      </div>
    </main>
  );
}
