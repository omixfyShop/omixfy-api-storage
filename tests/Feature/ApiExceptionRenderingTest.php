<?php

use Illuminate\Support\Facades\Route;

it('returns a structured JSON 500 for unexpected exceptions on API routes', function () {
    config(['app.debug' => false]);

    Route::get('/api/_test/boom', function () {
        throw new RuntimeException('Database connection timed out');
    });

    $response = $this->get('/api/_test/boom');

    $response->assertStatus(500)
        ->assertJsonStructure(['message', 'code', 'reference'])
        ->assertJson([
            'code' => 'internal_error',
            'message' => 'An unexpected error occurred while processing your request.',
        ]);

    expect($response->json('message'))->not->toContain('Database connection timed out');
    expect($response->json('reference'))->not->toBeEmpty();
    expect($response->getContent())->not->toContain('<!DOCTYPE html>');
});

it('includes the real exception message when APP_DEBUG is enabled', function () {
    config(['app.debug' => true]);

    Route::get('/api/_test/boom-debug', function () {
        throw new RuntimeException('Database connection timed out');
    });

    $response = $this->get('/api/_test/boom-debug');

    $response->assertStatus(500)
        ->assertJson([
            'code' => 'internal_error',
            'message' => 'Database connection timed out',
        ]);
});

it('does not rewrite HTTP exceptions into the internal error shape', function () {
    config(['app.debug' => false]);

    Route::get('/api/_test/not-found', function () {
        abort(404, 'Not here');
    });

    $response = $this->getJson('/api/_test/not-found');

    $response->assertStatus(404);
    expect($response->json('code'))->not->toBe('internal_error');
});
