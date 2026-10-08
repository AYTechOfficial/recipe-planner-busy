"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, Card, EmptyState, ListRow } from "@/components/ui";
import { readLocal, writeLocal } from "@/lib/persist";

type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

const STORAGE_KEY = "recipes";

export default function SettingsPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);

  useEffect(() => {
    const saved = readLocal<Recipe[]>(STORAGE_KEY, []);
    setRecipes(Array.isArray(saved) ? saved : []);
  }, []);

  function clearRecipes() {
    setRecipes([]);
    writeLocal(STORAGE_KEY, []);
  }

  return (
    <main className="min-h-screen bg-[#0b0d10] px-4 py-8 text-[#e6e9ef] sm:px-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-8 border-b border-white/10 pb-6">
          <Link href="/" className="text-sm text-[#4f8cff] hover:underline">← Recipe collection</Link>
          <p className="mt-5 font-mono text-xs uppercase tracking-[0.2em] text-[#4f8cff]">Preferences / 02</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-2 text-sm text-white/50">Manage recipes saved on this device.</p>
        </header>

        <section aria-labelledby="data-heading">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 id="data-heading" className="text-sm font-semibold">Saved recipes</h2>
              <p className="mt-1 text-xs text-white/45">{recipes.length} {recipes.length === 1 ? "recipe" : "recipes"} stored locally</p>
            </div>
            {recipes.length > 0 ? (
              <Button variant="danger" size="sm" onClick={clearRecipes}>Clear all</Button>
            ) : null}
          </div>
          <Card>
            {recipes.length === 0 ? (
              <EmptyState
                title="No saved recipes"
                description="Recipes you add to your collection will appear here."
                action={<Link href="/" className="text-xs text-[#4f8cff] hover:underline">Add a recipe</Link>}
                className="border-0 bg-transparent px-2 py-8"
              />
            ) : (
              <div className="space-y-2">
                {recipes.map((recipe) => (
                  <ListRow
                    key={recipe.id}
                    title={recipe.title}
                    subtitle={recipe.notes || "No notes"}
                    trailing={<span className="font-mono text-[10px] text-white/35">{recipe.id.slice(0, 8)}</span>}
                  />
                ))}
              </div>
            )}
          </Card>
        </section>
      </div>
    </main>
  );
}
