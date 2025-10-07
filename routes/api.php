<?php

use App\Http\Controllers\Api\V1\FolderController;
use App\Http\Controllers\AssetController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [AssetController::class, 'health']);

Route::middleware('token')->group(function () {
  Route::post('/assets/upload', [AssetController::class, 'upload']);
  Route::get('/assets/list', [AssetController::class, 'list']);
  Route::delete('/assets/file', [AssetController::class, 'delete']);
});

Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::get('/folders', [FolderController::class, 'index']);
    Route::post('/folders', [FolderController::class, 'store']);
    Route::get('/folders/{folder}', [FolderController::class, 'show']);
    Route::patch('/folders/{folder}', [FolderController::class, 'update']);
    Route::post('/folders/{folder}/move', [FolderController::class, 'move']);
    Route::delete('/folders/{folder}', [FolderController::class, 'destroy']);
    Route::post('/folders/{folder}/restore', [FolderController::class, 'restore']);
    Route::get('/folders/{folder}/children', [FolderController::class, 'children']);
    Route::get('/folders/{folder}/preview', [FolderController::class, 'preview']);
    Route::post('/folders/{folder}/tokens', [FolderController::class, 'createToken']);
});
