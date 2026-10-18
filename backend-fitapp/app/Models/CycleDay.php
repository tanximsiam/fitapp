<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/** One calendar day of the optional cycle tracker: bleeding flow and/or symptoms. */
class CycleDay extends Model
{
    public const FLOWS = ['spotting', 'light', 'medium', 'heavy'];

    public const SYMPTOMS = ['cramps', 'headache', 'bloating', 'back_pain', 'breast_tenderness', 'acne', 'fatigue', 'nausea', 'mood_changes', 'cravings'];

    protected $fillable = ['date', 'flow', 'symptoms', 'note'];

    protected function casts(): array
    {
        return ['symptoms' => 'array', 'note' => 'encrypted'];
    }
}
