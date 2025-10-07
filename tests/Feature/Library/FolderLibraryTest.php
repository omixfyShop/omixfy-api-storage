<?php

use App\Jobs\GenerateFolderPreview;
use App\Models\Folder;
use App\Models\User;
use Illuminate\Support\Facades\Queue;

use function Pest\Laravel\actingAs;
use function Pest\Laravel\deleteJson;
use function Pest\Laravel\getJson;
use function Pest\Laravel\postJson;

beforeEach(function () {
    Queue::fake([GenerateFolderPreview::class]);
    $this->user = User::factory()->create();
    actingAs($this->user, 'sanctum');
});

it('creates root and subfolders with breadcrumbs', function () {
    $rootResponse = postJson('/api/v1/folders', [
        'name' => 'Design',
    ])->assertCreated();

    $rootId = $rootResponse->json('data.id');

    $childResponse = postJson('/api/v1/folders', [
        'name' => 'Moodboards',
        'parent_id' => $rootId,
    ])->assertCreated();

    $childId = $childResponse->json('data.id');

    getJson("/api/v1/folders/{$childId}")
        ->assertOk()
        ->assertJsonPath('data.breadcrumbs.0.name', 'Design')
        ->assertJsonPath('data.breadcrumbs.1.name', 'Moodboards')
        ->assertJsonPath('data.depth', 1);
});

it('prevents moving a folder into its descendant', function () {
    $parent = Folder::factory()->create(['owner_id' => $this->user->id]);
    $child = Folder::factory()->childOf($parent)->create();

    postJson("/api/v1/folders/{$parent->id}/move", [
        'parent_id' => $child->id,
    ])->assertStatus(422);
});

it('moves a folder to the root level', function () {
    $parent = Folder::factory()->create(['owner_id' => $this->user->id]);
    $child = Folder::factory()->childOf($parent)->create();

    postJson("/api/v1/folders/{$child->id}/move", [
        'parent_id' => null,
    ])->assertOk();

    $child->refresh();
    expect($child->parent_id)->toBeNull();
    expect($child->depth)->toBe(0);
});

it('restores a deleted folder with a unique slug', function () {
    $response = postJson('/api/v1/folders', [
        'name' => 'Projects',
    ])->assertCreated();

    $firstId = $response->json('data.id');

    deleteJson("/api/v1/folders/{$firstId}")->assertOk();

    $secondSlug = postJson('/api/v1/folders', [
        'name' => 'Projects',
    ])->assertCreated()->json('data.slug');

    $restoredSlug = postJson("/api/v1/folders/{$firstId}/restore")
        ->assertOk()
        ->assertJsonStructure(['data' => ['slug']])
        ->json('data.slug');

    expect($restoredSlug)->not->toBe($secondSlug);
});
