<?php

namespace App\Http\Controllers;

use App\Services\Zepp\ZeppClient;
use App\Services\Zepp\ZeppSync;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use InvalidArgumentException;

/**
 * Receives Zepp event deliveries (dailies, sleeps, activity pings, authorisation changes).
 * Zepp sends text/plain bodies without signatures, so the secret path token is the protection.
 */
class ZeppWebhookController extends Controller
{
    public function __invoke(Request $request, ZeppSync $sync, string $token): Response
    {
        $expected = (string) config('zepp.webhook_token');
        abort_unless(ZeppClient::configured() && hash_equals($expected, $token), 404);

        try {
            $sync->handleWebhook($request->getContent());
        } catch (InvalidArgumentException) {
            return response('Invalid payload', 400);
        }

        // Any 2xx acknowledges the delivery; Zepp recommends 204.
        return response()->noContent();
    }
}
