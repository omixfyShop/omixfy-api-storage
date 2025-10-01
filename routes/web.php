<?php

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
        return Inertia::render('Assets/Upload');
    })->name('assets.upload');

    Route::get('assets/list', function () {
        return Inertia::render('Assets/List');
    })->name('assets.list');
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
