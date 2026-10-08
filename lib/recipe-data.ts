export type Recipe = {
  id: string;
  title: string;
  notes: string;
  created_at: string;
};

export type Planner = Record<string, string>;

export type Preferences = {
  dailyCookingMinutes: number;
  servings: number;
  dietaryPreference: string;
};

export const RECIPE_KEY = "student-recipes-v1";
export const PLANNER_KEY = "student-planner-v1";
export const PREFERENCES_KEY = "student-preferences-v1";

export const DEFAULT_PREFERENCES: Preferences = {
  dailyCookingMinutes: 30,
  servings: 1,
  dietaryPreference: "No preference",
};
