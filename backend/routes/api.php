<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\ArtworkController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\AvatarController;
use App\Http\Controllers\Api\ExperienceController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PostController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\AdminArtworkController;
use App\Http\Controllers\Api\AdminPostController;
use App\Http\Controllers\Api\AdminEventController;
use App\Http\Controllers\Api\AdminExperienceController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\TaskController;

Route::post('/login', [AuthController::class, 'login']);

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

// Públicas
Route::get('/artworks', [ArtworkController::class, 'index']);
Route::get('/artworks/{id}', [ArtworkController::class, 'show']);
Route::get('/review-avatars', [AvatarController::class, 'index']);
Route::post('/artworks/{id}/reviews', [ReviewController::class, 'store']);
Route::get('/experience/{unique_hash}', [ExperienceController::class, 'show']);
Route::get('/posts', [PostController::class, 'index']);
Route::get('/posts/{slug}', [PostController::class, 'show']);
Route::get('/events', [EventController::class, 'index']);
Route::get('/events/{slug}', [EventController::class, 'show']);

// Checkout e envio
Route::get('/checkout/shipping', [ShippingController::class, 'options']);
Route::post('/checkout', [PaymentController::class, 'checkout'])->middleware('throttle:30,1');
Route::get('/orders/{id}/status', [OrderController::class, 'status']);
Route::post('/webhooks/mercadopago', [PaymentController::class, 'webhook'])->middleware('throttle:60,1');

// Admin
Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);

    // Obras
    Route::delete('/admin/artworks/{id}/media/{mediaId}', [AdminArtworkController::class, 'destroyMedia']);
    Route::apiResource('/admin/artworks', AdminArtworkController::class);

    // Coleções
    Route::apiResource('/admin/collections', \App\Http\Controllers\Api\AdminCollectionController::class);

    // Posts
    Route::apiResource('/admin/posts', AdminPostController::class);

    // Eventos
    Route::apiResource('/admin/events', AdminEventController::class);

    // Experiências
    Route::get('/admin/experiences', [AdminExperienceController::class, 'index']);
    Route::get('/admin/experiences/{id}', [AdminExperienceController::class, 'show']);
    Route::put('/admin/experiences/{id}', [AdminExperienceController::class, 'update']);

    // Tarefas
    Route::get('/admin/tasks', [TaskController::class, 'index']);
    Route::post('/admin/tasks', [TaskController::class, 'store']);
    Route::put('/admin/tasks/{id}', [TaskController::class, 'update']);
    Route::delete('/admin/tasks/{id}', [TaskController::class, 'destroy']);
    Route::patch('/admin/tasks/{taskId}/subtasks/{subtaskId}', [TaskController::class, 'toggleSubtask']);

    // Pedidos
    Route::get('/admin/orders', [OrderController::class, 'index']);
    Route::get('/admin/orders/{id}', [OrderController::class, 'show']);
    Route::patch('/admin/orders/{id}/shipping', [OrderController::class, 'updateShipping']);
    Route::put('/admin/orders/{id}/experience', [OrderController::class, 'updateExperience']);
});
