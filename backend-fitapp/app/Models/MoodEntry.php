<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MoodEntry extends Model
{
    protected $fillable = ['date', 'recorded_at', 'mood', 'energy', 'stress', 'note'];

    protected function casts(): array
    {
        return ['recorded_at' => 'datetime', 'note' => 'encrypted'];
    }

    public function emotions(): HasMany
    {
        return $this->hasMany(MoodEntryEmotion::class)->orderBy('id');
    }

    /** @param list<string> $names */
    public function setEmotions(array $names): void
    {
        $this->emotions()->delete();
        $this->emotions()->createMany(array_map(fn ($e) => ['emotion' => $e], array_values(array_unique($names))));
        $this->load('emotions');
    }
}
