<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminEventController extends Controller
{
    public function index()
    {
        return response()->json(Event::orderBy('starts_at', 'desc')->paginate(20));
    }

    public function show($id)
    {
        return response()->json(Event::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'description'  => 'required|string',
            'location'     => 'required|string|max:255',
            'starts_at'    => 'required|date',
            'ends_at'      => 'nullable|date|after:starts_at',
            'cover_image'  => 'nullable|url',
            'external_url' => 'nullable|url',
            'is_featured'  => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);

        return response()->json(Event::create($validated), 201);
    }

    public function update(Request $request, $id)
    {
        $event = Event::findOrFail($id);

        $validated = $request->validate([
            'title'        => 'sometimes|required|string|max:255',
            'description'  => 'sometimes|required|string',
            'location'     => 'sometimes|required|string|max:255',
            'starts_at'    => 'sometimes|required|date',
            'ends_at'      => 'nullable|date',
            'cover_image'  => 'nullable|url',
            'external_url' => 'nullable|url',
            'is_featured'  => 'boolean',
        ]);

        if (isset($validated['title']) && $validated['title'] !== $event->title) {
            $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);
        }

        $event->update($validated);

        return response()->json($event->fresh());
    }

    public function destroy($id)
    {
        Event::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
