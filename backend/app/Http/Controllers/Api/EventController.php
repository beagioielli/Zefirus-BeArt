<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;

class EventController extends Controller
{
    public function index()
    {
        return response()->json(Event::orderBy('starts_at', 'asc')->paginate(12));
    }

    public function show($slug)
    {
        return response()->json(Event::where('slug', $slug)->firstOrFail());
    }
}
