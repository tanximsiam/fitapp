<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/** One calendar day of the optional cycle tracker: bleeding flow and/or symptoms. */
class CycleDay extends Model
{
    public const FLOWS = ['spotting', 'light', 'medium', 'heavy'];

    public const SYMPTOMS = ['cramps', 'headache', 'bloating', 'back_pain', 'breast_tenderness', 'acne', 'fatigue', 'nausea', 'mood_changes', 'cravings'];

    protected $fillable = ['date', 'flow', 'note'];

    protected function casts(): array
    {
        return ['note' => 'encrypted'];
    }

    public function symptoms(): HasMany
    {
        return $this->hasMany(CycleDaySymptom::class)->orderBy('id');
    }

    /** @param list<string> $names */
    public function setSymptoms(array $names): void
    {
        $this->symptoms()->delete();
        $this->symptoms()->createMany(array_map(fn ($s) => ['symptom' => $s], array_values(array_unique($names))));
        $this->load('symptoms');
    }
}
