<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArtCollection;

class CollectionController extends Controller
{
    public function index()
    {
        $collections = ArtCollection::orderBy('title')->get();
        return response()->json($collections);
    }

    public function show($slug)
    {
        $collection = ArtCollection::with(['artworks' => function($q) {
            $q->where('is_archived', false)->with('media');
        }])->where('slug', $slug)->firstOrFail();
        return response()->json($collection);
    }
}
