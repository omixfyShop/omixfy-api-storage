<?php

namespace Database\Factories;

use App\Models\Asset;
use App\Models\Folder;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Asset>
 */
class AssetFactory extends Factory
{
    protected $model = Asset::class;

    public function definition(): array
    {
        return [
            'path' => 'assets/'.$this->faker->uuid.'.jpg',
            'folder_id' => Folder::factory(),
            'owner_id' => User::factory(),
            'mime' => 'image/jpeg',
            'width' => 1024,
            'height' => 768,
            'size_bytes' => 204800,
            'generated_thumbs' => [],
        ];
    }
}
