<?php

use App\Models\Setting;
use App\Models\User;
use Illuminate\Support\Arr;
use function Pest\Laravel\actingAs;
use function Pest\Laravel\delete;
use function Pest\Laravel\get;
use function Pest\Laravel\post;
use function Pest\Laravel\put;

it('allows the master user to toggle public registration', function () {
    $master = User::factory()->create(['is_master' => true]);
    Setting::put('registration_enabled', ['on' => false]);

    actingAs($master);

    $response = put('/api/admin/settings/registration', ['on' => true]);

    $response->assertOk();
    $response->assertJsonPath('data.on', true);

    expect((bool) Arr::get(Setting::get('registration_enabled', []), 'on'))->toBeTrue();
});

it('prevents non-master users from accessing user management routes', function () {
    $user = User::factory()->create();

    actingAs($user);

    get('/admin/users')->assertForbidden();
    get('/api/admin/users')->assertForbidden();
    post('/api/admin/users', [])->assertForbidden();
});

it('creates a user with a generated password when requested', function () {
    $master = User::factory()->create(['is_master' => true]);

    actingAs($master);

    $response = post('/api/admin/users', [
        'name' => 'Invited User',
        'email' => 'invited@example.com',
        'generate_password' => true,
    ]);

    $response->assertCreated();
    $response->assertJsonStructure([
        'data' => ['id', 'name', 'email', 'is_master', 'created_at'],
        'temporary_password',
    ]);

    $payload = $response->json();
    expect($payload['temporary_password'])->not->toBeEmpty();

    $user = User::query()->where('email', 'invited@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->is_master)->toBeFalse();
    expect($user->email_verified_at)->not->toBeNull();
});

it('does not allow the master user to be deleted', function () {
    $master = User::factory()->create(['is_master' => true]);

    actingAs($master);

    $response = delete("/api/admin/users/{$master->id}");

    $response->assertStatus(422);
    $response->assertJsonPath('message', 'Não é possível remover o usuário master.');
    expect(User::query()->count())->toBe(1);
});
