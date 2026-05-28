<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artwork;
use Illuminate\Http\Request;

class ArtworkController extends Controller
{
    public function index(Request $request)
    {
        $artworks = Artwork::where('is_archived', false)->with('media')->latest()->paginate(12);
        return response()->json($artworks);
    }

    public function show($id)
    {
        $artwork = Artwork::where('is_archived', false)->with(['media', 'reviews', 'experience'])->findOrFail($id);
        return response()->json($artwork);
    }
}
