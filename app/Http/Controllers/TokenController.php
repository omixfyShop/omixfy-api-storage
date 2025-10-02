<?php

namespace App\Http\Controllers;

use App\Models\AccessToken;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TokenController extends Controller
{
    /**
     * Display a listing of the authenticated user's tokens.
     */
    public function index(Request $request): Response
    {
        $tokens = $request->user()
            ->accessTokens()
            ->latest()
            ->get(['id', 'name', 'token_hash', 'created_at', 'last_used_at'])
            ->map(fn (AccessToken $token) => [
                'id' => $token->id,
                'name' => $token->name,
                'preview' => $token->token_hash ? substr($token->token_hash, -4) : null,
                'created_at' => $token->created_at,
                'last_used_at' => $token->last_used_at,
            ])
            ->values();

        $plainToken = $request->session()->pull('plain_token');
        $highlightedTokenId = $request->session()->pull('created_token_id');

        return Inertia::render('tokens/index', [
            'tokens' => $tokens,
            'plainToken' => $plainToken,
            'highlightedTokenId' => $highlightedTokenId,
        ]);
    }

    /**
     * Store a newly created token for the authenticated user.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:50'],
        ]);

        $name = $validated['name'] ?? null;
        if ($name !== null) {
            $name = trim($name);
            if ($name === '') {
                $name = null;
            }
        }

        [$token, $plainToken] = AccessToken::createForUser($request->user(), $name);

        return redirect()
            ->route('tokens.index')
            ->with('plain_token', $plainToken)
            ->with('created_token_id', $token->id);
    }

    /**
     * Remove the specified token.
     */
    public function destroy(Request $request, AccessToken $token): RedirectResponse
    {
        abort_if($token->user_id !== $request->user()->id, 404);

        $token->delete();

        return redirect()->route('tokens.index');
    }
}
