<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Post;

class PostController extends Controller
{
    public function index()
    {
        return response()->json(Post::where('is_published', true)->latest('published_at')->paginate(12));
    }

    public function show($slug)
    {
        return response()->json(Post::where('slug', $slug)->firstOrFail());
    }
}
