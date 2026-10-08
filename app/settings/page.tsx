"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import Link from "next/link";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";
import {
  DEFAULT_PREFERENCES,
  PLANNER_KEY,
  PREFERENCES_KEY,
  RECIPE_KEY,
  type Planner,
  type Preferences,
  type Recipe,
} from "@/lib/recipe-data";

type SettingsData = {
  ready: boolean;
  preferences: Preferences;
  recipes: Recipe[];
  planner: Planner;
};

type Backup = {
  recipes: Recipe[];
  planner: Planner;
  preferences: Preferences;
};

function isRecipe(value: unknown): value is Recipe {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && typeof item.title === "string" && typeof item.notes === "string" && typeof item.created_at === "string";
}

function isPlanner(value: unknown): value is Planner {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return Object.values(value).every((item) => typeof item === "string");
}

function isPreferences(value: unknown): value is Preferences {
  if (!value || typeof value !== "object") return false;
  const item = value as Record<string, unknown>;
  return typeof item.dailyCookingMinutes === "number" && typeof item.servings === "number" && typeof item.dietaryPreference === "string";
}

export default function SettingsPage() {
  const [data, setData] = useState<SettingsData>({
    ready: false,
    preferences: DEFAULT_PREFERENCES,
    recipes: [],
    planner: {},
  });
  const [backupText, setBackupText] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const storedPreferences = readLocal<Preferences>(PREFERENCES_KEY, DEFAULT_PREFERENCES);
    const storedRecipes = readLocal<Recipe[]>(RECIPE_KEY, []);
    const storedPlanner = readLocal<Planner>(PLANNER_KEY, {});
    const preferences = isPreferences(storedPreferences) ? storedPreferences : DEFAULT_PREFERENCES;
    const recipes = Array.isArray(storedRecipes) ? storedRecipes.filter(isRecipe) : [];
    const planner = isPlanner(storedPlanner) ? storedPlanner : {};
    setData({ ready: true, preferences, recipes, planner });
    setBackupText(JSON.stringify({ preferences, recipes, planner }, null, 2));
  }, []);

  useEffect(() => {
    if (!data.ready) return;
    writeLocal(PREFERENCES_KEY, data.preferences);
    writeLocal(RECIPE_KEY, data.recipes);
    writeLocal(PLANNER_KEY, data.planner);
  }, [data]);

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setData((current) => ({ ...current, preferences: { ...current.preferences, [key]: value } }));
    setStatus("Preferences saved on this device.");
  }

  function exportBackup() {
    const contents = JSON.stringify({ preferences: data.preferences, recipes: data.recipes, planner: data.planner }, null, 2);
    const blob = new Blob([contents], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "student-recipe-planner-backup.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Backup downloaded.");
  }

  function importBackup() {
    try {
      const parsed: unknown = JSON.parse(backupText);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid backup");
      const backup = parsed as Record<string, unknown>;
      if (!Array.isArray(backup.recipes) || !backup.recipes.every(isRecipe) || !isPlanner(backup.planner) || !isPreferences(backup.preferences)) {
        throw new Error("Invalid backup");
      }
      const restored: SettingsData = {
        ready: true,
        recipes: backup.recipes,
        planner: backup.planner,
        preferences: backup.preferences,
      };
      setData(restored);
      setBackupText(JSON.stringify({ preferences: restored.preferences, recipes: restored.recipes, planner: restored.planner }, null, 2));
      setStatus("Backup restored.");
    } catch {
      setStatus("Could not read that backup. Check that it is a planner backup JSON file.");
    }
  }

  function clearData() {
    if (!window.confirm("Delete all recipes, meal plans, and preferences from this device? This cannot be undone.")) return;
    const cleared: SettingsData = { ready: true, preferences: DEFAULT_PREFERENCES, recipes: [], planner: {} };
    setData(cleared);
    setBackupText(JSON.stringify({ preferences: cleared.preferences, recipes: cleared.recipes, planner: cleared.planner }, null, 2));
    setStatus("All planner data was cleared from this device.");
  }

  function handleBackupText(event: ChangeEvent<HTMLTextAreaElement>) {
    setBackupText(event.target.value);
    setStatus("");
  }

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-5 py-8 text-[var(--primary)] sm:px-8">
      <header className="mb-10 flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Student kitchen / planner</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Settings</h1>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/" className="rounded-lg px-3 py-2 text-sm text-white/55 hover:bg-white/5 hover:text-white">Recipes</Link>
          <Link href="/settings" className="rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5">Settings</Link>
        </nav>
      </header>

      <div className="space-y-6">
        <section>
          <div className="mb-3">
            <p className="font-mono text-xs text-white/40">PLANNING DEFAULTS</p>
            <h2 className="mt-1 text-lg font-semibold">Preferences</h2>
          </div>
          <Card className="space-y-5">
            <label className="grid gap-2 sm:grid-cols-[1fr_12rem] sm:items-center">
              <span><span className="block text-sm font-medium">Daily cooking time</span><span className="text-xs text-white/45">How much time you usually have to cook.</span></span>
              <span className="flex items-center gap-2">
                <input type="number" min={5} max={240} step={5} value={data.preferences.dailyCookingMinutes} onChange={(event) => updatePreference("dailyCookingMinutes", Math.min(240, Math.max(5, Number(event.target.value) || 5)))} className="w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
                <span className="text-xs text-white/45">min</span>
              </span>
            </label>
            <label className="grid gap-2 sm:grid-cols-[1fr_12rem] sm:items-center">
              <span><span className="block text-sm font-medium">Default servings</span><span className="text-xs text-white/45">Number of portions to plan for.</span></span>
              <input type="number" min={1} max={12} value={data.preferences.servings} onChange={(event) => updatePreference("servings", Math.min(12, Math.max(1, Number(event.target.value) || 1)))} className="w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]" />
            </label>
            <label className="grid gap-2 sm:grid-cols-[1fr_12rem] sm:items-center">
              <span><span className="block text-sm font-medium">Dietary preference</span><span className="text-xs text-white/45">A reminder for your meal planning.</span></span>
              <select value={data.preferences.dietaryPreference} onChange={(event) => updatePreference("dietaryPreference", event.target.value)} className="w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]">
                <option>No preference</option>
                <option>Vegetarian</option>
                <option>Vegan</option>
                <option>Gluten-free</option>
                <option>Dairy-free</option>
                <option>Other</option>
              </select>
            </label>
            <p aria-live="polite" className="min-h-4 text-xs text-white/45">{status}</p>
          </Card>
        </section>

        <section>
          <div className="mb-3">
            <p className="font-mono text-xs text-white/40">LOCAL DATA</p>
            <h2 className="mt-1 text-lg font-semibold">Data management</h2>
          </div>
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">Stored on this device</p>
                <p className="mt-1 text-xs text-white/45">Your recipes and preferences stay in this browser. No account or server is used.</p>
              </div>
              <Badge tone="brand">{data.recipes.length} {data.recipes.length === 1 ? "recipe" : "recipes"}</Badge>
            </div>
            {data.recipes.length === 0 ? (
              <EmptyState title="No recipes saved yet" message="Add recipes from your recipe collection. They will appear here in your local backup." className="py-6" />
            ) : (
              <div className="space-y-2">
                {data.recipes.map((recipe) => (
                  <div key={recipe.id} className="flex items-center justify-between gap-3 rounded-lg border border-white/10 px-3 py-2">
                    <span className="truncate text-sm">{recipe.title}</span>
                    <span className="shrink-0 font-mono text-[10px] text-white/35">{recipe.id.slice(0, 8)}</span>
                  </div>
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2 border-t border-white/10 pt-4">
              <Button onClick={exportBackup}>Export backup</Button>
              <Button variant="danger" onClick={clearData}>Clear all data</Button>
            </div>
          </Card>
        </section>

        <section>
          <div className="mb-3">
            <p className="font-mono text-xs text-white/40">BACKUP RESTORE</p>
            <h2 className="mt-1 text-lg font-semibold">Import planner data</h2>
          </div>
          <Card className="space-y-3">
            <p className="text-xs text-white/45">Paste the contents of a backup file to restore its recipes, plan, and preferences.</p>
            <textarea value={backupText} onChange={handleBackupText} rows={8} spellCheck={false} aria-label="Backup JSON" className="w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2.5 font-mono text-xs text-white/75 outline-none focus:border-[var(--accent)]" />
            <Button variant="secondary" onClick={importBackup}>Restore backup</Button>
          </Card>
        </section>
      </div>
    </main>
  );
}
