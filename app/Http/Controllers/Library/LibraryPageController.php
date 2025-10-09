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
        return Inertia::render('library/index', [
            'initialFolderId' => $folder?->id,
            'initialBreadcrumbs' => $folder?->breadcrumbs ?? [],
        ]);
    }
}
