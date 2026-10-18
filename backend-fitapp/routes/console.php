<?php

use App\Models\User;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Validator;

Artisan::command('fitapp:create-user {email} {--name=}', function (string $email) {
    $name = $this->option('name') ?: $this->ask('Name', strstr($email, '@', true));
    $password = $this->secret('Password (min 8 characters)');

    $validator = Validator::make(
        ['email' => $email, 'name' => $name, 'password' => $password],
        ['email' => ['required', 'email', 'unique:users,email'], 'name' => ['required', 'string', 'max:255'], 'password' => ['required', 'string', 'min:8']],
    );
    if ($validator->fails()) {
        foreach ($validator->errors()->all() as $error) {
            $this->error($error);
        }

        return 1;
    }

    $user = User::create(['email' => $email, 'name' => $name, 'password' => $password]);
    $this->info("Created user #{$user->id} ({$user->email}).");
})->purpose('Create a FitApp account');

Artisan::command('fitapp:ingest-token {email} {--name=bridge}', function (string $email) {
    $user = User::where('email', $email)->first();
    if (! $user) {
        $this->error("No user with email {$email}.");

        return 1;
    }

    $token = $user->createToken($this->option('name'), ['ingest'])->plainTextToken;
    $this->info('Ingest token (shown once, store it in your bridge configuration):');
    $this->line($token);
})->purpose('Issue a token that may only upload data to POST /api/ingest');
