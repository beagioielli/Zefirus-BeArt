<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcquiredExperience;
use Illuminate\Http\Request;

class AdminExperienceController extends Controller
{
    public function index()
    {
        return response()->json(
            AcquiredExperience::with('artwork:id,title')->latest()->paginate(20)
        );
    }

    public function show($id)
    {
        return response()->json(
            AcquiredExperience::with('artwork')->findOrFail($id)
        );
    }

    public function update(Request $request, $id)
    {
        $experience = AcquiredExperience::findOrFail($id);

        $validated = $request->validate([
            'dedication'         => 'nullable|string|max:2000',
            'creation_video_url' => 'nullable|url',
            'exhibition_history' => 'nullable|string|max:5000',
        ]);

        $experience->update($validated);

        return response()->json($experience->fresh()->load('artwork:id,title'));
    }
}
