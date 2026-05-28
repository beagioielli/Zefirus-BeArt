<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ArtCollection extends Model
{
    use HasFactory;

    protected $guarded = [];

    public function artworks()
    {
        return $this->hasMany(Artwork::class);
    }
}
