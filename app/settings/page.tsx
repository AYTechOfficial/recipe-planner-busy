"use client";

import { ChangeEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

type Preferences = {
  dietaryPreference: string;
  weeklyBudget: string;
  maxCookTime: string;
};

const RECIPES_KEY = "campus-recipes-v1";
const PREFERENCES_KEY = "campus-recipe-preferences-v1";
const DEFAULT_PREFERENCES: Preferences = { dietaryPreference: "No preference", weeklyBudget: "50", maxCookTime: "20" };

function isRecipe(value: unknown): value is Recipe {
  if (typeof value !== "object" || value === null) return false;
  const recipe = value as Record<string, unknown>;
  return typeof recipe.id === "string" && typeof recipe.title === "string" && typeof recipe.notes === "string" && typeof recipe.created_at === "string";
}

function validPreferences(value: unknown): Preferences {
  if (typeof value !== "object" || value === null) return DEFAULT_PREFERENCES;
  const preferences = value as Record<string, unknown>;
  return {
    dietaryPreference: typeof preferences.dietaryPreference === "string" ? preferences.dietaryPreference : DEFAULT_PREFERENCES.dietaryPreference,
    weeklyBudget: typeof preferences.weeklyBudget === "string" ? preferences.weeklyBudget : DEFAULT_PREFERENCES.weeklyBudget,
    maxCookTime: typeof preferences.maxCookTime === "string" ? preferences.maxCookTime : DEFAULT_PREFERENCES.maxCookTime,
  };
}

export default function SettingsPage() {
  const [preferences, setPreferences] = useState<Preferences>(DEFAULT_PREFERENCES);
  const [recipeCount, setRecipeCount] = useState(0);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const storedPreferences = readLocal<unknown>(PREFERENCES_KEY, DEFAULT_PREFERENCES);
    const storedRecipes = readLocal<unknown>(RECIPES_KEY, []);
    setPreferences(validPreferences(storedPreferences));
    setRecipeCount(Array.isArray(storedRecipes) ? storedRecipes.filter(isRecipe).length : 0);
    setReady(true);
  }, []);

  function updatePreference<K extends keyof Preferences>(key: K, value: Preferences[K]) {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    writeLocal(PREFERENCES_KEY, next);
  }

  function clearCollection() {
    if (!window.confirm("Delete every saved recipe? This cannot be undone.")) return;
    writeLocal(RECIPES_KEY, []);
    setRecipeCount(0);
    setMessage("Your recipe collection has been cleared.");
  }

  function exportCollection() {
    const stored = readLocal<unknown>(RECIPES_KEY, []);
    const recipes = Array.isArray(stored) ? stored.filter(isRecipe) : [];
    const contents = JSON.stringify({ exportedAt: new Date().toISOString(), recipes }, null, 2);
    const blob = new Blob([contents], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "campus-kitchen-recipes.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setMessage(`Exported ${recipes.length} ${recipes.length === 1 ? "recipe" : "recipes"}.`);
  }

  function importCollection(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result));
        let candidate: unknown = parsed;
        if (typeof parsed === "object" && parsed !== null && "recipes" in parsed) candidate = parsed.recipes;
        if (!Array.isArray(candidate) || !candidate.every(isRecipe)) throw new Error("invalid file");
        const current = readLocal<unknown>(RECIPES_KEY, []);
        const existing = Array.isArray(current) ? current.filter(isRecipe) : [];
        const byId = new Map(existing.map((recipe) => [recipe.id, recipe]));
        for (const recipe of candidate) byId.set(recipe.id, recipe);
        const merged = Array.from(byId.values());
        writeLocal(RECIPES_KEY, merged);
        setRecipeCount(merged.length);
        setMessage(`Imported ${candidate.length} ${candidate.length === 1 ? "recipe" : "recipes"}.`);
      } catch {
        setMessage("That file could not be imported. Choose a Campus Kitchen recipe export.");
      }
    };
    reader.onerror = () => setMessage("The selected file could not be read.");
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] text-[#e6e9ef]">
      <div className="mx-auto max-w-5xl px-5 pb-16 pt-6 sm:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link href="/" className="flex items-center gap-3" aria-label="Campus Kitchen home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#4f8cff]/30 bg-[#4f8cff]/10 text-[#77a8ff]"><svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true"><path d="M4 12h16M6 12a6 6 0 0 1 12 0M7 16h10M9 19h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/><path d="M12 3v2" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"/></svg></span>
            <span><span className="block text-sm font-semibold tracking-wide">CAMPUS KITCHEN</span><span className="block text-[11px] text-white/40">A little more planned. A lot less stressed.</span></span>
          </Link>
          <nav className="flex items-center gap-1 rounded-lg border border-white/10 bg-[#14171c] p-1 text-sm" aria-label="Main navigation"><Link href="/" className="rounded-md px-3 py-2 text-white/55 transition hover:bg-white/5 hover:text-white">My recipes</Link><Link href="/settings" aria-current="page" className="rounded-md bg-white/10 px-3 py-2 text-white">Settings</Link></nav>
        </header>

        <div className="mb-8 mt-9"><Badge tone="brand">PREFERENCES & DATA</Badge><h1 className="mt-3 text-3xl font-semibold tracking-tight">Make it work for you.</h1><p className="mt-2 max-w-xl text-sm leading-6 text-white/50">Set a few kitchen goals and manage the recipes saved on this device.</p></div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <Card className="border-white/[0.08] bg-[#14171c] p-5 sm:p-6">
            <div className="mb-6"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#4f8cff]">YOUR ROUTINE</p><h2 className="mt-1 text-lg font-semibold">Cooking preferences</h2><p className="mt-1 text-xs leading-5 text-white/45">These are reminders for your planning. They stay on this device.</p></div>
            <div className="space-y-5">
              <label className="block"><span className="mb-1.5 block text-sm text-white/75">Eating style</span><select value={preferences.dietaryPreference} disabled={!ready} onChange={(event) => updatePreference("dietaryPreference", event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 text-sm text-white outline-none focus:border-[#4f8cff]/60"><option>No preference</option><option>Vegetarian</option><option>Vegan</option><option>Pescatarian</option><option>Gluten-free</option><option>Dairy-free</option></select></label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="mb-1.5 block text-sm text-white/75">Weekly food budget</span><span className="relative block"><span className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-white/40">$</span><input type="number" min="0" max="9999" value={preferences.weeklyBudget} disabled={!ready} onChange={(event) => updatePreference("weeklyBudget", event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-[#0b0d10] pl-8 pr-3 font-mono text-sm text-white outline-none focus:border-[#4f8cff]/60" /></span></label>
                <label className="block"><span className="mb-1.5 block text-sm text-white/75">Ideal cook time</span><span className="relative block"><input type="number" min="1" max="240" value={preferences.maxCookTime} disabled={!ready} onChange={(event) => updatePreference("maxCookTime", event.target.value)} className="h-11 w-full rounded-lg border border-white/10 bg-[#0b0d10] px-3 pr-14 font-mono text-sm text-white outline-none focus:border-[#4f8cff]/60" /><span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/40">minutes</span></span></label>
              </div>
            </div>
            <p className="mt-5 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-xs text-white/40"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Saved automatically on this device</p>
          </Card>

          <Card className="border-white/[0.08] bg-[#14171c] p-5 sm:p-6">
            <div className="mb-6"><p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#4f8cff]">YOUR DATA</p><h2 className="mt-1 text-lg font-semibold">Recipe collection</h2><p className="mt-1 text-xs leading-5 text-white/45">Your recipes are stored locally in this browser. Nothing is sent to an account or server.</p></div>
            <div className="flex items-center justify-between rounded-lg border border-white/[0.08] bg-black/10 px-4 py-3"><span className="text-sm text-white/65">Saved recipes</span><span className="font-mono text-lg text-white">{ready ? String(recipeCount).padStart(2, "0") : "··"}</span></div>
            <div className="mt-4 space-y-3">
              <Button variant="secondary" className="w-full justify-between" onClick={exportCollection} disabled={!ready}><span>Export recipe data</span><span aria-hidden="true">↓</span></Button>
              <label className={`flex h-10 w-full cursor-pointer items-center justify-between rounded-lg border border-white/10 bg-[#0b0d10] px-4 text-sm font-medium text-white transition hover:border-white/25 ${!ready ? "pointer-events-none opacity-50" : ""}`}><span>Import recipes from file</span><span className="text-white/45" aria-hidden="true">↑</span><input type="file" accept="application/json,.json" disabled={!ready} onChange={importCollection} className="sr-only" /></label>
              <Button variant="danger" className="w-full justify-between" onClick={clearCollection} disabled={!ready || recipeCount === 0}><span>Delete all recipes</span><span aria-hidden="true">×</span></Button>
            </div>
            {message ? <p role="status" className="mt-4 rounded-lg border border-[#4f8cff]/20 bg-[#4f8cff]/[0.07] px-3 py-2 text-xs text-[#a9c7ff]">{message}</p> : null}
            <p className="mt-5 border-t border-white/[0.07] pt-4 font-mono text-[10px] leading-5 text-white/30">LOCAL STORAGE · PRIVATE TO THIS BROWSER<br />Export a backup before clearing browser data.</p>
          </Card>
        </div>
        <div className="mt-6"><Link href="/" className="inline-flex items-center gap-2 text-sm text-white/45 transition hover:text-white"><span aria-hidden="true">←</span> Back to your recipes</Link></div>
      </div>
    </main>
  );
}
