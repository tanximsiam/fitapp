<?php

namespace App\Http\Requests;

/** Rule fragments shared by the journal requests. */
final class JournalRules
{
    /** ISO 8601 instant with an explicit offset, so the local date is unambiguous. */
    public const INSTANT = ['required', 'date', 'regex:/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$/'];

    public const NOTE = ['nullable', 'string', 'max:2000'];

    /** Optional optimistic-concurrency token: the `updated_at` the client last saw. */
    public const SEEN = ['nullable', 'string'];
}
