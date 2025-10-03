<?php

use App\Models\Setting;
use App\Models\User;

it('renders the registration screen when public registration is open', function () {
    $response = $this->get(route('register'));

    $response->assertOk();
});

it('creates the first user as master and disables public registration', function () {
    $response = $this->post(route('register.store'), [
        'name' => 'Test User',
        'email' => 'test@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $this->assertAuthenticated();
    $response->assertRedirect(route('dashboard', absolute: false));

    $user = User::query()->first();
    expect($user)->not->toBeNull();
    expect($user->is_master)->toBeTrue();

    $settings = Setting::get('registration_enabled');
    expect($settings)->toBeArray()
        ->and(data_get($settings, 'on'))->toBeFalse();
});

it('blocks registration attempts once public registration is disabled', function () {
    User::factory()->create(['is_master' => true]);
    Setting::put('registration_enabled', ['on' => false]);

    $getResponse = $this->get(route('register'));
    $getResponse->assertRedirect(route('login'));

    $postResponse = $this->from(route('register'))->post(route('register.store'), [
        'name' => 'Another User',
        'email' => 'another@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ]);

    $postResponse->assertRedirect(route('login'));
    $postResponse->assertSessionHas('status', 'Cadastro desabilitado');
    expect(User::query()->count())->toBe(1);
});