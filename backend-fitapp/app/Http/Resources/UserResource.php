<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\User */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'timezone' => $this->timezone,
            'birth_date' => $this->birth_date?->toDateString(),
            'onboarded' => $this->onboarded_at !== null,
            'goals' => $this->goals(),
            'preferences' => ['trackers' => $this->trackers(), 'wearable' => $this->wearable()],
            'created_at' => $this->created_at?->toIso8601ZuluString(),
        ];
    }
}
