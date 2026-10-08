"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

type Meal = "Breakfast" | "Lunch" | "Dinner" | "Snack";
type MealPlan = Record<string, Partial<Record<Meal, string>>>;

const RECIPE_STORAGE_KEY = "recipe-planner-recipes";
const PLAN_STORAGE_KEY = "recipe-planner-meal-plan";
const MEALS: Meal[] = ["Breakfast", "Lunch", "Dinner", "Snack"];

function dateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfWeek(date: Date): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = (result.getDay() + 6) % 7;
  result.setDate(result.getDate() - day);
  return result;
}

function createId(): string {
  return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function HomePage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [mealPlan, setMealPlan] = useState<MealPlan>({});
  const [ready, setReady] = useState(false);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setRecipes(readLocal<Recipe[]>(RECIPE_STORAGE_KEY, []));
    setMealPlan(readLocal<MealPlan>(PLAN_STORAGE_KEY, {}));
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeLocal(RECIPE_STORAGE_KEY, recipes);
  }, [ready, recipes]);

  useEffect(() => {
    if (ready) writeLocal(PLAN_STORAGE_KEY, mealPlan);
  }, [ready, mealPlan]);

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter((recipe) =>
      `${recipe.title} ${recipe.notes}`.toLowerCase().includes(query),
    );
  }, [recipes, search]);

  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, index) => {
        const date = new Date(weekStart);
        date.setDate(date.getDate() + index);
        return date;
      }),
    [weekStart],
  );

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
      setRecipes((current) =>
        current.map((recipe) =>
          recipe.id === editingId ? { ...recipe, title: cleanTitle, notes: notes.trim() } : recipe,
        ),
      );
    } else {
      setRecipes((current) => [
        { id: createId(), title: cleanTitle, notes: notes.trim(), created_at: new Date().toISOString() },
        ...current,
      ]);
    }
    setFormOpen(false);
    setEditingId(null);
    setTitle("");
    setNotes("");
  }

  function deleteRecipe(id: string) {
    setRecipes((current) => current.filter((recipe) => recipe.id !== id));
    setMealPlan((current) => {
      const next: MealPlan = {};
      for (const [day, meals] of Object.entries(current)) {
        const remaining = Object.fromEntries(
          Object.entries(meals).filter(([, recipeId]) => recipeId !== id),
        ) as Partial<Record<Meal, string>>;
        if (Object.keys(remaining).length > 0) next[day] = remaining;
      }
      return next;
    });
  }

  function setPlannedMeal(day: string, meal: Meal, recipeId: string) {
    setMealPlan((current) => {
      const next: MealPlan = { ...current };
      const dayPlan = { ...(next[day] ?? {}) };
      if (recipeId) dayPlan[meal] = recipeId;
      else delete dayPlan[meal];
      if (Object.keys(dayPlan).length > 0) next[day] = dayPlan;
      else delete next[day];
      return next;
    });
  }

  function moveWeek(amount: number) {
    setWeekStart((current) => {
      const next = new Date(current);
      next.setDate(next.getDate() + amount * 7);
      return next;
    });
  }

  const plannedCount = weekDays.reduce((total, day) => {
    const meals = mealPlan[dateKey(day)];
    return total + (meals ? Object.keys(meals).length : 0);
  }, 0);
  const weekLabel = `${weekDays[0].toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${weekDays[6].toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e6e9ef]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex flex-col gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-xs uppercase tracking-[0.22em] text-[#4f8cff]">Student kitchen / 01</p>
            <h1 className="text-3xl font-semibold tracking-tight">Recipe planner</h1>
            <p className="mt-2 text-sm text-white/50">Keep your recipes close. Make a plan that works for your week.</p>
          </div>
          <Button onClick={openNewRecipe}>＋ Add a recipe</Button>
        </header>

        <section aria-labelledby="plan-heading" className="mb-10">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 id="plan-heading" className="text-xl font-semibold">Your week</h2>
                <Badge tone="brand">{plannedCount} planned</Badge>
              </div>
              <p className="text-sm text-white/45">Choose a saved recipe for any meal. Your plan is saved on this device.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="secondary" size="sm" aria-label="Previous week" onClick={() => moveWeek(-1)}>←</Button>
              <span className="min-w-40 text-center font-mono text-xs text-white/70">{weekLabel}</span>
              <Button variant="secondary" size="sm" aria-label="Next week" onClick={() => moveWeek(1)}>→</Button>
              <Button variant="ghost" size="sm" onClick={() => setWeekStart(startOfWeek(new Date()))}>Today</Button>
            </div>
          </div>

          {!ready ? (
            <div className="rounded-xl border border-white/10 bg-[#14171c] p-8 text-center text-sm text-white/45">Loading your plan…</div>
          ) : recipes.length === 0 ? (
            <EmptyState
              title="Start with a recipe"
              description="Add a recipe to your collection, then assign it to a meal in your weekly plan."
              action={<Button size="sm" onClick={openNewRecipe}>＋ Add your first recipe</Button>}
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
              {weekDays.map((day) => {
                const key = dateKey(day);
                const isToday = key === dateKey(new Date());
                return (
                  <Card key={key} className={`min-w-0 p-3 ${isToday ? "border-[#4f8cff]/50" : ""}`}>
                    <div className="mb-3 border-b border-white/10 pb-2">
                      <p className="text-xs font-medium text-white/55">{day.toLocaleDateString(undefined, { weekday: "short" })}</p>
                      <p className={`font-mono text-lg ${isToday ? "text-[#4f8cff]" : "text-white/90"}`}>{day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}</p>
                    </div>
                    <div className="space-y-3">
                      {MEALS.map((meal) => {
                        const selectedId = mealPlan[key]?.[meal] ?? "";
                        const selectedRecipe = recipes.find((recipe) => recipe.id === selectedId);
                        return (
                          <label key={meal} className="block">
                            <span className="mb-1 block text-[10px] font-medium uppercase tracking-wider text-white/40">{meal}</span>
                            <select
                              aria-label={`${meal} for ${day.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}`}
                              value={selectedId}
                              onChange={(event) => setPlannedMeal(key, meal, event.target.value)}
                              className={`w-full rounded-md border border-white/10 bg-[#0b0d10] px-2 py-2 text-xs outline-none focus:border-[#4f8cff]/70 ${selectedRecipe ? "text-white/85" : "text-white/35"}`}
                            >
                              <option value="">＋ Plan a meal</option>
                              {recipes.map((recipe) => <option key={recipe.id} value={recipe.id}>{recipe.title}</option>)}
                            </select>
                            {selectedRecipe?.notes ? <span className="mt-1 block truncate text-[10px] text-white/35">{selectedRecipe.notes}</span> : null}
                          </label>
                        );
                      })}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        <section aria-labelledby="recipes-heading">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <h2 id="recipes-heading" className="text-xl font-semibold">Recipe collection</h2>
                <Badge>{recipes.length}</Badge>
              </div>
              <p className="text-sm text-white/45">Your personal list of quick, reliable meals.</p>
            </div>
            {recipes.length > 0 ? (
              <label className="block sm:w-72">
                <span className="sr-only">Search recipes</span>
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search recipes…"
                  className="h-10 w-full rounded-lg border border-white/10 bg-[#14171c] px-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#4f8cff]/60"
                />
              </label>
            ) : null}
          </div>

          {formOpen ? (
            <Card className="mb-4 border-[#4f8cff]/30">
              <form onSubmit={saveRecipe} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{editingId ? "Edit recipe" : "New recipe"}</h3>
                  <Button variant="ghost" size="sm" onClick={() => setFormOpen(false)}>Close</Button>
                </div>
                <label className="block">
                  <span className="mb-1.5 block text-xs text-white/55">Recipe name</span>
                  <input autoFocus required maxLength={100} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. One-pot tomato pasta" className="h-10 w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 text-sm outline-none focus:border-[#4f8cff]/60" />
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs text-white/55">Notes <span className="text-white/30">(optional)</span></span>
                  <textarea maxLength={500} rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Ingredients, prep time, or a reminder…" className="w-full resize-y rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2 text-sm outline-none focus:border-[#4f8cff]/60" />
                </label>
                <div className="flex gap-2">
                  <Button type="submit">{editingId ? "Save changes" : "Save recipe"}</Button>
                  <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          ) : null}

          {!ready ? null : recipes.length === 0 ? (
            <EmptyState title="No recipes saved yet" description="Add the meals you like to cook. You can then plan them across your week." action={<Button size="sm" onClick={openNewRecipe}>Add a recipe</Button>} />
          ) : filteredRecipes.length === 0 ? (
            <EmptyState title="No matching recipes" description="Try another search term or clear your search." action={<Button variant="secondary" size="sm" onClick={() => setSearch("")}>Clear search</Button>} />
          ) : (
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {filteredRecipes.map((recipe) => (
                <Card key={recipe.id} className="flex flex-col justify-between gap-4">
                  <div className="min-w-0">
                    <h3 className="break-words font-medium">{recipe.title}</h3>
                    {recipe.notes ? <p className="mt-2 whitespace-pre-wrap break-words text-sm leading-relaxed text-white/50">{recipe.notes}</p> : <p className="mt-2 text-sm text-white/30">No notes added.</p>}
                  </div>
                  <div className="flex items-center justify-between border-t border-white/10 pt-3">
                    <span className="font-mono text-[10px] text-white/30">Added {new Date(recipe.created_at).toLocaleDateString()}</span>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEditRecipe(recipe)}>Edit</Button>
                      <Button variant="danger" size="sm" onClick={() => deleteRecipe(recipe.id)}>Delete</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
