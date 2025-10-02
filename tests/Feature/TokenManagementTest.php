<?php

use App\Models\AccessToken;
use App\Models\User;

it('allows an authenticated user to create a token', function () {
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post('/tokens', [
        'name' => 'Deploy',
    ]);

    $response->assertRedirect(route('tokens.index'));

    $token = AccessToken::query()->where('user_id', $user->id)->first();

    expect($token)->not()->toBeNull();
    expect($token?->name)->toBe('Deploy');
    expect($token?->token_hash)->toBeString()->toHaveLength(64);
    expect(session()->has('plain_token'))->toBeTrue();
});

it('allows users to delete their own tokens', function () {
    $user = User::factory()->create();
    $token = AccessToken::factory()->for($user)->create();

    $response = $this->actingAs($user)->delete('/tokens/'.$token->id);

    $response->assertRedirect(route('tokens.index'));

    $this->assertDatabaseMissing('access_tokens', [
        'id' => $token->id,
    ]);
});

it('prevents users from deleting tokens that belong to someone else', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $token = AccessToken::factory()->for($otherUser)->create();

    $response = $this->actingAs($user)->delete('/tokens/'.$token->id);

    $response->assertNotFound();

    $this->assertDatabaseHas('access_tokens', [
        'id' => $token->id,
    ]);
});
