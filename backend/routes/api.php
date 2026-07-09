<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CompanyProfileController;
use App\Http\Controllers\HealthController;
use Illuminate\Support\Facades\Route;

// Health check
Route::get('/v1/health', HealthController::class);

// Auth (public)
Route::prefix('v1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Protected routes
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    Route::get('/company-profile', [CompanyProfileController::class, 'show']);
    Route::put('/company-profile', [CompanyProfileController::class, 'store']);
});
