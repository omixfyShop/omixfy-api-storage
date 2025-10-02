<?php

use App\Models\AccessToken;
use App\Models\User;
use Carbon\Carbon;

it('returns unauthorized when token is missing', function () {
    $response = $this->getJson('/api/assets/list');

    $response->assertStatus(401)
        ->assertJson(['message' => 'Unauthorized']);
});

it('returns unauthorized when token is invalid', function () {
    $response = $this->getJson('/api/assets/list', [
        'Authorization' => 'Bearer invalid-token',
    ]);

    $response->assertStatus(401)
        ->assertJson(['message' => 'Unauthorized']);
});

it('allows access with a valid token and updates last_used_at', function () {
    $user = User::factory()->create();

    [$token, $plainToken] = AccessToken::createForUser($user, 'Integration');

    expect($token->last_used_at)->toBeNull();

    Carbon::setTestNow(Carbon::create(2025, 1, 1, 12, 0, 0));

    $response = $this->getJson('/api/assets/list', [
        'Authorization' => 'Bearer '.$plainToken,
    ]);

    $response->assertOk();

    $token->refresh();

    expect($token->last_used_at)->not()->toBeNull();
    expect($token->last_used_at?->equalTo(now()))->toBeTrue();

    Carbon::setTestNow();
});
