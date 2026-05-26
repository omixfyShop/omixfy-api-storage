<?php

namespace App\Http\Controllers\Api\V1\Concerns;

use Illuminate\Http\Request;

trait ResolvesUserId
{
    private function getUserId(Request $request): ?int
    {
        return $request->user()?->id ?? $request->attributes->get('token_user_id');
    }
}
