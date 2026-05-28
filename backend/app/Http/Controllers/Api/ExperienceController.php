<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AcquiredExperience;

class ExperienceController extends Controller
{
    public function show($unique_hash)
    {
        $experience = AcquiredExperience::with('artwork.media')
            ->where('unique_hash', $unique_hash)
            ->firstOrFail();

        return response()->json($experience);
    }
}
