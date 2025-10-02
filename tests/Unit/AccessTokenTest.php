<?php

use App\Models\AccessToken;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(Tests\TestCase::class, RefreshDatabase::class);

it('generates a plain token and stores only the hash', function () {
    $user = User::factory()->create();

    [$token, $plainToken] = AccessToken::createForUser($user, 'Primary token');

    expect($plainToken)->toBeString()->toHaveLength(64);
    expect($token->token_hash)->toBe(hash('sha256', $plainToken));
    expect($token->name)->toBe('Primary token');
    expect($token->user_id)->toBe($user->id);
});

it('updates the last_used_at timestamp when marked as used', function () {
    $token = AccessToken::factory()->create(['last_used_at' => null]);

    Carbon::setTestNow(Carbon::create(2025, 1, 1, 9, 30));

    $token->markAsUsed();
    $token->refresh();

    expect($token->last_used_at)->not()->toBeNull();
    expect($token->last_used_at?->equalTo(now()))->toBeTrue();

    Carbon::setTestNow();
});
