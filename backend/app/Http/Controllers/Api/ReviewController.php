<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmotionalReview;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function store(Request $request, $id)
    {
        $validated = $request->validate([
            'guest_name' => 'required|string|max:255',
            'sentiment_text' => 'required|string',
            'avatar_url' => 'required|url',
        ]);

        $validated['artwork_id'] = $id;

        $review = EmotionalReview::create($validated);

        return response()->json($review, 201);
    }
}
