<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AdminPostController extends Controller
{
    public function index()
    {
        return response()->json(Post::latest('published_at')->paginate(20));
    }

    public function show($id)
    {
        return response()->json(Post::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title'        => 'required|string|max:255',
            'excerpt'      => 'nullable|string',
            'content'      => 'required|string',
            'cover_image'  => 'nullable|url',
            'published_at' => 'nullable|date',
            'is_published' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);

        return response()->json(Post::create($validated), 201);
    }

    public function update(Request $request, $id)
    {
        $post = Post::findOrFail($id);

        $validated = $request->validate([
            'title'        => 'sometimes|required|string|max:255',
            'excerpt'      => 'nullable|string',
            'content'      => 'sometimes|required|string',
            'cover_image'  => 'nullable|url',
            'published_at' => 'nullable|date',
            'is_published' => 'boolean',
        ]);

        if (isset($validated['title']) && $validated['title'] !== $post->title) {
            $validated['slug'] = Str::slug($validated['title']) . '-' . Str::random(5);
        }

        $post->update($validated);

        return response()->json($post->fresh());
    }

    public function destroy($id)
    {
        Post::findOrFail($id)->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }
}
