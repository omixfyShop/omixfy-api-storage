<?php

namespace App\Http\Controllers\Library;

use App\Http\Controllers\Controller;
use App\Models\Folder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LibraryPageController extends Controller
{
    public function __invoke(Request $request, ?Folder $folder = null): Response
    {
        $user = $request->user();

        if ($folder && $folder->owner_id !== $user?->id) {
            abort(404);
        }

        return Inertia::render('library/index', [
            'initialFolderId' => $folder?->id,
            'initialBreadcrumbs' => $folder?->breadcrumbs ?? [],
        ]);
    }
}
