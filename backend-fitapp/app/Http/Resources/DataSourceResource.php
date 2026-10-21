<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin \App\Models\DataSource */
class DataSourceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'key' => $this->key,
            'name' => $this->name,
            'device' => $this->device,
            // What the source says it provides vs. what FitApp has actually received from it.
            'measurements' => $this->measurements->pluck('measurement')->all(),
            'last_ingested_at' => $this->last_ingested_at?->toIso8601ZuluString(),
            'latest_date' => $this->whenHas('latest_date'),
            'received' => $this->whenHas('received'),
        ];
    }
}
