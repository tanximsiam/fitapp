<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Meal extends Model
{
    protected $fillable = ['date', 'eaten_at', 'meal_type', 'note'];

    protected function casts(): array
    {
        return ['eaten_at' => 'datetime', 'note' => 'encrypted'];
    }

    public function items(): HasMany
    {
        return $this->hasMany(MealItem::class)->orderBy('id');
    }
}
