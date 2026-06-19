<?php

use App\Http\Controllers\Api\V1\FolderChildrenController;
use App\Http\Controllers\Api\V1\FolderController;
use App\Http\Controllers\Api\V1\FolderMoveController;
use App\Http\Controllers\Api\V1\FolderTokenController;
use App\Http\Controllers\AssetController;
use App\Http\Controllers\AssetDerivativeController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [AssetController::class, 'health']);

Route::middleware('token')->group(function () {
    Route::post('/assets/upload', [AssetController::class, 'upload']);
    Route::get('/assets/derivative', [AssetDerivativeController::class, 'derivative']);
    Route::get('/assets/list', [AssetController::class, 'list']);
    Route::delete('/assets/file', [AssetController::class, 'delete']);
    Route::patch('/assets/rename', [AssetController::class, 'rename']);

    Route::prefix('v1')->group(function () {
        Route::get('/folders', [FolderController::class, 'index']);
        Route::post('/folders', [FolderController::class, 'store']);
        Route::get('/folders/{folder}', [FolderController::class, 'show']);
        Route::patch('/folders/{folder}', [FolderController::class, 'update']);
        Route::delete('/folders/{folder}', [FolderController::class, 'destroy']);
        Route::post('/folders/{folder}/restore', [FolderController::class, 'restore']);

        Route::post('/folders/{folder}/move', [FolderMoveController::class, 'move']);

        Route::get('/folders/{folder}/children', [FolderChildrenController::class, 'children']);
        Route::get('/folders/{folder}/preview', [FolderChildrenController::class, 'preview']);
        Route::post('/folders/{folder}/assets/{asset}/toggle-preview', [FolderChildrenController::class, 'togglePreview']);

        Route::post('/folders/{folder}/tokens', [FolderTokenController::class, 'createToken']);
    });
});
