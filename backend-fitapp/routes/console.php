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
