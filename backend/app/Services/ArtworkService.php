<?php

namespace App\Services;

use App\Models\Artwork;

class ArtworkService
{
    public function list($perPage = 15)
    {
        return Artwork::with('media')->paginate($perPage);
    }

    public function find($id)
    {
        return Artwork::with(['media', 'reviews', 'experience'])->findOrFail($id);
    }
}
