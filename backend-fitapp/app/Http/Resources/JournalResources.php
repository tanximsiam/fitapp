<?php

namespace App\Http\Resources;

use App\Models\ActivityEntry;
use App\Models\CycleDay;
use App\Models\HydrationEntry;
use App\Models\Meal;
use App\Models\MealItem;
use App\Models\MoodEntry;

/**
 * Serializers for manual records. Every record carries `provenance: "manual"` so clients can tell it
 * apart from watch measurements, and `updated_at` for edit-conflict checks.
 */
final class JournalResources
{
    public static function mood(MoodEntry $e, string $tz): array
    {
        return [
            'id' => $e->id,
            'date' => $e->date,
            'recorded_at' => $e->recorded_at->setTimezone($tz)->toIso8601String(),
            'mood' => $e->mood,
            'energy' => $e->energy,
            'stress' => $e->stress,
            'emotions' => $e->emotions->pluck('emotion')->all(),
            'note' => $e->note,
        ] + self::meta($e);
    }

    public static function meal(Meal $m, string $tz): array
    {
        return [
            'id' => $m->id,
            'date' => $m->date,
            'eaten_at' => $m->eaten_at->setTimezone($tz)->toIso8601String(),
            'meal_type' => $m->meal_type,
            'note' => $m->note,
            'items' => $m->items->map(fn (MealItem $i) => [
                'name' => $i->name,
                'quantity' => $i->quantity,
                'unit' => $i->unit,
                'energy_kcal' => $i->energy_kcal,
                'protein_g' => $i->protein_g,
                'carbs_g' => $i->carbs_g,
                'fat_g' => $i->fat_g,
                'nutrition_source' => $i->nutrition_source,
            ])->all(),
        ] + self::meta($m);
    }

    public static function hydration(HydrationEntry $h, string $tz): array
    {
        return [
            'id' => $h->id,
            'date' => $h->date,
            'recorded_at' => $h->recorded_at->setTimezone($tz)->toIso8601String(),
            'volume_ml' => $h->volume_ml,
        ] + self::meta($h);
    }

    public static function activity(ActivityEntry $a, string $tz): array
    {
        return [
            'id' => $a->id,
            'date' => $a->date,
            'started_at' => $a->started_at->setTimezone($tz)->toIso8601String(),
            'activity_type' => $a->activity_type,
            'duration_min' => $a->duration_min,
            'energy_kcal' => $a->energy_kcal,
            'energy_source' => $a->energy_source,
        ] + self::meta($a);
    }

    public static function cycleDay(CycleDay $c): array
    {
        return [
            'id' => $c->id,
            'date' => $c->date,
            'flow' => $c->flow,
            'symptoms' => $c->symptoms->pluck('symptom')->all(),
            'note' => $c->note,
        ] + self::meta($c);
    }

    private static function meta($model): array
    {
        return ['provenance' => 'manual', 'updated_at' => $model->updated_at?->toIso8601ZuluString()];
    }
}
