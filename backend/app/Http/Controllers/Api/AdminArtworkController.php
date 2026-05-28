<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artwork;
use Illuminate\Http\Request;

class AdminArtworkController extends Controller
{
    public function index()
    {
        return response()->json(Artwork::with('media')->latest()->paginate(50));
    }

    public function show($id)
    {
        return response()->json(Artwork::with('media')->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'dimensions' => 'required|string',
            'price' => 'nullable|numeric',
            'stock' => 'required|integer',
            'is_sold' => 'boolean',
            'is_archived' => 'boolean',
            'is_awarded' => 'boolean',
            'year' => 'nullable|string',
            'art_collection_id' => 'nullable|exists:art_collections,id',
            'external_video_url' => 'nullable|url',
            'meli_category_id' => 'nullable|string',
            'meli_condition' => 'nullable|string',
            'meli_listing_type' => 'nullable|string',
            'availability' => 'nullable|string',
            'edition_info' => 'nullable|string',
            'shipping_weight' => 'nullable|numeric|min:0',
            'shipping_height' => 'nullable|integer|min:0',
            'shipping_width'  => 'nullable|integer|min:0',
            'shipping_length' => 'nullable|integer|min:0',
        ]);

        $artwork = Artwork::create($validated);

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $artwork->addMedia($photo)->toMediaCollection('gallery');
            }
        }

        return response()->json($artwork->load('media'), 201);
    }

    public function update(Request $request, $id)
    {
        $artwork = Artwork::findOrFail($id);

        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'dimensions' => 'required|string',
            'price' => 'nullable|numeric',
            'stock' => 'required|integer',
            'is_sold' => 'boolean',
            'is_archived' => 'boolean',
            'is_awarded' => 'boolean',
            'year' => 'nullable|string',
            'art_collection_id' => 'nullable|exists:art_collections,id',
            'external_video_url' => 'nullable|url',
            'meli_category_id' => 'nullable|string',
            'meli_condition' => 'nullable|string',
            'meli_listing_type' => 'nullable|string',
            'availability' => 'nullable|string',
            'edition_info' => 'nullable|string',
            'shipping_weight' => 'nullable|numeric|min:0',
            'shipping_height' => 'nullable|integer|min:0',
            'shipping_width'  => 'nullable|integer|min:0',
            'shipping_length' => 'nullable|integer|min:0',
        ]);

        $artwork->update($validated);

        if ($request->hasFile('photos')) {
            foreach ($request->file('photos') as $photo) {
                $artwork->addMedia($photo)->toMediaCollection('gallery');
            }
        }

        return response()->json($artwork->load('media'));
    }

    public function destroy($id)
    {
        $artwork = Artwork::findOrFail($id);
        $artwork->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function destroyMedia($id, $mediaId)
    {
        $artwork = Artwork::findOrFail($id);
        $artwork->media()->where('id', $mediaId)->delete();
        return response()->json(['message' => 'Media deleted']);
    }
}
