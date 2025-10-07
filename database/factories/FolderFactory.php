<?php

namespace Database\Factories;

use App\Models\Folder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Folder>
 */
class FolderFactory extends Factory
{
    protected $model = Folder::class;

    public function definition(): array
    {
        $name = $this->faker->unique()->words(asText: true);

        return [
            'uuid' => (string) Str::uuid(),
            'name' => ucfirst($name),
            'slug' => Str::slug($name),
            'owner_id' => User::factory(),
            'access_level' => 'private',
            'depth' => 0,
            'files_count' => 0,
            'folders_count' => 0,
        ];
    }

    public function childOf(Folder $parent): self
    {
        return $this->state(function () use ($parent) {
            return [
                'parent_id' => $parent->id,
                'owner_id' => $parent->owner_id,
                'depth' => $parent->depth + 1,
            ];
        });
    }
}
