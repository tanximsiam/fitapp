<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MealItem extends Model
{
    public const NUTRIENTS = ['energy_kcal', 'protein_g', 'carbs_g', 'fat_g'];

    protected $fillable = ['name', 'quantity', 'unit', 'energy_kcal', 'protein_g', 'carbs_g', 'fat_g'];

    protected function casts(): array
    {
        return array_fill_keys(['quantity', ...self::NUTRIENTS], 'float');
    }
}
