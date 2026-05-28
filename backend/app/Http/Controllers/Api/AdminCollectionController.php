<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ArtCollection;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminCollectionController extends Controller
{
    public function index()
    {
        return response()->json(ArtCollection::latest()->get());
    }

    public function show($id)
    {
        return response()->json(ArtCollection::with('artworks')->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'artwork_ids' => 'nullable|array',
            'artwork_ids.*' => 'integer|exists:artworks,id'
        ]);

        $validated['slug'] = Str::slug($validated['title']);
        $collection = ArtCollection::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'slug' => $validated['slug']
        ]);

        if (isset($validated['artwork_ids'])) {
            \App\Models\Artwork::whereIn('id', $validated['artwork_ids'])->update(['art_collection_id' => $collection->id]);
        }

        return response()->json($collection, 201);
    }

    public function update(Request $request, $id)
    {
        $collection = ArtCollection::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'artwork_ids' => 'nullable|array',
            'artwork_ids.*' => 'integer|exists:artworks,id'
        ]);

        if ($request->title !== $collection->title) {
            $validated['slug'] = Str::slug($validated['title']);
        }

        $collection->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'slug' => $validated['slug'] ?? $collection->slug
        ]);

        if (array_key_exists('artwork_ids', $validated)) {
            \App\Models\Artwork::where('art_collection_id', $collection->id)->update(['art_collection_id' => null]);
            if (!empty($validated['artwork_ids'])) {
                \App\Models\Artwork::whereIn('id', $validated['artwork_ids'])->update(['art_collection_id' => $collection->id]);
            }
        }

        return response()->json($collection);
    }

    public function destroy($id)
    {
        $collection = ArtCollection::findOrFail($id);
        $collection->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
