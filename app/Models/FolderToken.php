<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

class FolderToken extends Model
{
    use HasFactory;

    protected $fillable = [
        'folder_id',
        'token',
        'can_create_subfolders',
        'can_upload',
        'expires_at',
    ];

    protected $casts = [
        'can_create_subfolders' => 'boolean',
        'can_upload' => 'boolean',
        'expires_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::creating(function (self $token): void {
            $token->token = $token->token ?: hash('sha256', Str::uuid()->toString());
        });
    }

    public function folder(): BelongsTo
    {
        return $this->belongsTo(Folder::class);
    }
}
