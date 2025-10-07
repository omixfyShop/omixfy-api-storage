<?php

use App\Http\Controllers\Admin\SettingsController as AdminSettingsController;
use App\Http\Controllers\Admin\UserController as AdminUserController;
use App\Http\Controllers\Admin\UsersPageController;
use App\Http\Controllers\TokenController;
use App\Http\Controllers\Library\LibraryPageController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('assets/upload', function () {
        return Inertia::render('assets/upload');
    })->name('assets.upload');

    Route::get('assets/list', function () {
        return Inertia::render('assets/list');
    })->name('assets.list');

    Route::get('library', LibraryPageController::class)->name('library.index');
    Route::get('library/{folder}', LibraryPageController::class)
        ->whereNumber('folder')
        ->name('library.show');

    Route::resource('tokens', TokenController::class)->only(['index', 'store', 'destroy']);

    Route::get('admin/users', UsersPageController::class)->name('admin.users.index');
});

Route::middleware(['auth', 'verified'])->prefix('api/admin')->group(function () {
    Route::get('users', [AdminUserController::class, 'index']);
    Route::post('users', [AdminUserController::class, 'store']);
    Route::delete('users/{user}', [AdminUserController::class, 'destroy']);

    Route::get('settings/registration', [AdminSettingsController::class, 'showRegistration']);
    Route::put('settings/registration', [AdminSettingsController::class, 'updateRegistration']);
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
