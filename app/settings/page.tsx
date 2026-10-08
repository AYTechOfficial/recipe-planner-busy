"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { Badge, Button, Card } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";

type Preferences = {
  eatingStyle: string;
  weeklyBudget: number;
  cookTime: string;
};

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

type MealPlan = Record<string, string>;
type Backup = { version: number; recipes: Recipe[]; preferences: Preferences; mealPlan: MealPlan };

const preferenceKey = "preferences";
const defaults: Preferences = { eatingStyle: "No preference", weeklyBudget: 50, cookTime: "30 minutes" };

function isRecipeList(value: unknown): value is Recipe[] {
  return Array.isArray(value) && value.every((item) =>
    item && typeof item === "object" &&
    typeof item.id === "string" && typeof item.title === "string" &&
    typeof item.notes === "string" && typeof item.created_at === "string"
  );
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = readLocal<Preferences>(preferenceKey, defaults);
    if (stored && typeof stored === "object") {
      setPreferences({
        eatingStyle: typeof stored.eatingStyle === "string" ? stored.eatingStyle : defaults.eatingStyle,
        weeklyBudget: typeof stored.weeklyBudget === "number" ? stored.weeklyBudget : defaults.weeklyBudget,
        cookTime: typeof stored.cookTime === "string" ? stored.cookTime : defaults.cookTime,
      });
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) writeLocal(preferenceKey, preferences);
  }, [ready, preferences]);

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    setPreferences((current) => ({ ...current, [key]: value }));
    setMessage("Preferences saved on this device.");
  }

  function exportData() {
    const backup: Backup = {
      version: 1,
      recipes: readLocal<Recipe[]>("recipes", []),
      preferences,
      mealPlan: readLocal<MealPlan>("mealPlan", {}),
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "recipe-planner-backup.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage("Your backup has been exported.");
  }

  async function importData(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid backup file.");
      const backup = parsed as Partial<Backup>;
      if (!isRecipeList(backup.recipes)) throw new Error("This file does not contain a valid recipe collection.");
      const importedPreferences = backup.preferences;
      if (!importedPreferences || typeof importedPreferences.eatingStyle !== "string" || typeof importedPreferences.weeklyBudget !== "number" || typeof importedPreferences.cookTime !== "string") {
        throw new Error("This file does not contain valid preferences.");
      }
      const plan = backup.mealPlan && typeof backup.mealPlan === "object" && !Array.isArray(backup.mealPlan) ? backup.mealPlan : {};
      writeLocal("recipes", backup.recipes);
      writeLocal(preferenceKey, importedPreferences);
      writeLocal("mealPlan", plan);
      setPreferences(importedPreferences);
      setMessage(`Imported ${backup.recipes.length} ${backup.recipes.length === 1 ? "recipe" : "recipes"}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not import this file.");
    }
    event.target.value = "";
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-5 py-8 text-[var(--primary)] sm:px-8">
      <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--accent)]">Recipe planner / settings</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Preferences</h1>
          <p className="mt-1 text-sm text-white/50">Personalize your meal planning and manage your data.</p>
        </div>
        <a href="/" className="rounded-lg px-3 py-2 text-sm text-white/65 hover:bg-white/5 hover:text-white">← Recipes</a>
      </header>

      <section className="space-y-6">
        <Card>
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="font-semibold">Cooking preferences</h2>
              <p className="mt-1 text-xs text-white/45">Used to guide your own recipe choices.</p>
            </div>
            <Badge tone={ready ? "pass" : "neutral"}>{ready ? "Saved locally" : "Loading"}</Badge>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="text-xs font-medium text-white/60">Eating style
              <select disabled={!ready} value={preferences.eatingStyle} onChange={(event) => updatePreference("eatingStyle", event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)] disabled:opacity-50">
                <option>No preference</option><option>Vegetarian</option><option>Vegan</option><option>Pescatarian</option><option>Gluten-free</option><option>Dairy-free</option>
              </select>
            </label>
            <label className="text-xs font-medium text-white/60">Weekly food budget
              <div className="mt-1.5 flex items-center rounded-lg border border-white/10 bg-[#0b0d10] px-3 focus-within:border-[var(--accent)]">
                <span className="text-sm text-white/40">$</span>
                <input disabled={!ready} type="number" min={0} max={1000} step={5} value={preferences.weeklyBudget} onChange={(event) => updatePreference("weeklyBudget", Math.max(0, Number(event.target.value)))} className="w-full bg-transparent px-2 py-2.5 text-sm text-white outline-none disabled:opacity-50" />
              </div>
            </label>
            <label className="text-xs font-medium text-white/60">Preferred cook time
              <select disabled={!ready} value={preferences.cookTime} onChange={(event) => updatePreference("cookTime", event.target.value)} className="mt-1.5 w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 py-2.5 text-sm text-white outline-none focus:border-[var(--accent)] disabled:opacity-50">
                <option>15 minutes</option><option>30 minutes</option><option>45 minutes</option><option>60 minutes</option><option>Any amount of time</option>
              </select>
            </label>
          </div>
        </Card>

        <Card>
          <h2 className="font-semibold">Data management</h2>
          <p className="mt-1 text-xs text-white/45">Recipes and preferences stay on this device. Export a backup or restore one from a JSON file.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={exportData}>Export data</Button>
            <Button variant="outline" onClick={() => fileInput.current?.click()}>Import backup</Button>
            <input ref={fileInput} type="file" accept="application/json,.json" onChange={importData} className="hidden" />
          </div>
          {message && <p role="status" className="mt-3 text-xs text-white/55">{message}</p>}
        </Card>
      </section>
    </main>
  );
}
