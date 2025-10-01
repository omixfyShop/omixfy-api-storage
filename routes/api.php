<?php

use App\Http\Controllers\AssetController;
use Illuminate\Support\Facades\Route;

Route::get('/health', [AssetController::class, 'health']);

Route::middleware('token')->group(function () {
    Route::post('/assets/upload', [AssetController::class, 'upload']);
    Route::get('/assets/list', [AssetController::class, 'list']);
    Route::delete('/assets/file', [AssetController::class, 'delete']);
});
