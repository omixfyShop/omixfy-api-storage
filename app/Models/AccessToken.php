<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Database\Factories\AccessTokenFactory;

class AccessToken extends Model
{
    use HasFactory;
    use HasUlids;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'user_id',
        'name',
        'token_hash',
        'last_used_at',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'token_hash',
    ];

    /**
     * Create a new factory instance for the model.
     */
    protected static function newFactory(): AccessTokenFactory
    {
        return AccessTokenFactory::new();
    }

    /**
     * Generate and persist an access token for the given user.
     */
    public static function createForUser(User $user, ?string $name = null): array
    {
        $plainToken = Str::random(64);
        $hash = hash('sha256', $plainToken);

        $token = self::query()->create([
            'user_id' => $user->id,
            'name' => $name,
            'token_hash' => $hash,
        ]);

        return [$token, $plainToken];
    }

    /**
     * Update the last used timestamp.
     */
    public function markAsUsed(): void
    {
        $this->forceFill(['last_used_at' => now()])->save();
    }

    /**
     * A token belongs to a user.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
