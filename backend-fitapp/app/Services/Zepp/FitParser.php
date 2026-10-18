<?php

namespace App\Services\Zepp;

use InvalidArgumentException;

/**
 * Minimal reader for Garmin FIT activity files: extracts the session summaries a workout needs.
 * Handles normal and compressed-timestamp record headers, both byte orders and developer fields;
 * all other messages are skipped.
 */
class FitParser
{
    /** Seconds between the Unix epoch and the FIT epoch (1989-12-31T00:00:00Z). */
    private const FIT_EPOCH = 631065600;

    private const SESSION = 18;

    /** @return list<array{start: ?int, elapsed_s: ?float, distance_m: ?float, kcal: ?int, avg_bpm: ?int, max_bpm: ?int, sport: ?int}> */
    public function sessions(string $bytes): array
    {
        if (strlen($bytes) < 12 || substr($bytes, 8, 4) !== '.FIT') {
            throw new InvalidArgumentException('Not a FIT file.');
        }
        $headerSize = ord($bytes[0]);
        $dataSize = unpack('V', substr($bytes, 4, 4))[1];
        $end = min(strlen($bytes), $headerSize + $dataSize);
        $pos = $headerSize;
        $definitions = [];
        $sessions = [];

        while ($pos < $end) {
            $header = ord($bytes[$pos++]);
            if ($header & 0x80) {
                $local = ($header >> 5) & 0x03; // compressed timestamp header: always a data message
            } elseif ($header & 0x40) {
                $local = $header & 0x0F;
                $big = ord($bytes[$pos + 1]) === 1;
                $global = unpack($big ? 'n' : 'v', substr($bytes, $pos + 2, 2))[1];
                $count = ord($bytes[$pos + 4]);
                $pos += 5;
                $fields = [];
                for ($i = 0; $i < $count; $i++, $pos += 3) {
                    $fields[] = ['num' => ord($bytes[$pos]), 'size' => ord($bytes[$pos + 1])];
                }
                $devSize = 0;
                if ($header & 0x20) {
                    $devCount = ord($bytes[$pos++]);
                    for ($i = 0; $i < $devCount; $i++, $pos += 3) {
                        $devSize += ord($bytes[$pos + 1]);
                    }
                }
                $definitions[$local] = compact('big', 'global', 'fields', 'devSize');

                continue;
            } else {
                $local = $header & 0x0F;
            }

            $def = $definitions[$local] ?? throw new InvalidArgumentException('FIT data message without definition.');
            $values = [];
            foreach ($def['fields'] as $f) {
                $values[$f['num']] = $this->unsigned(substr($bytes, $pos, $f['size']), $def['big']);
                $pos += $f['size'];
            }
            $pos += $def['devSize'];

            if ($def['global'] === self::SESSION) {
                $sessions[] = [
                    'start' => isset($values[2]) ? $values[2] + self::FIT_EPOCH : null,
                    'elapsed_s' => isset($values[7]) ? $values[7] / 1000 : null,
                    'distance_m' => isset($values[9]) ? $values[9] / 100 : null,
                    'kcal' => $values[11] ?? null,
                    'avg_bpm' => $values[16] ?? null,
                    'max_bpm' => $values[17] ?? null,
                    'sport' => $values[5] ?? null,
                ];
            }
        }

        return $sessions;
    }

    /** Unsigned integer of 1, 2 or 4 bytes; FIT's all-ones "invalid" value becomes null. */
    private function unsigned(string $raw, bool $big): ?int
    {
        $format = match (strlen($raw)) {
            1 => 'C',
            2 => $big ? 'n' : 'v',
            4 => $big ? 'N' : 'V',
            default => null,
        };
        if ($format === null) {
            return null;
        }
        $value = unpack($format, $raw)[1];

        return $value === (2 ** (8 * strlen($raw))) - 1 ? null : $value;
    }
}
