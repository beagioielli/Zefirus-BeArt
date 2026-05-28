<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Spatie\MediaLibrary\HasMedia;
use Spatie\MediaLibrary\InteractsWithMedia;
use Spatie\MediaLibrary\MediaCollections\Models\Media;
use Spatie\Image\Enums\AlignPosition;

class Artwork extends Model implements HasMedia
{
    use HasFactory, InteractsWithMedia;

    protected $guarded = [];

    protected $appends = ['image_url'];

    protected $casts = [
        'price'           => 'decimal:2',
        'is_sold'         => 'boolean',
        'shipping_weight' => 'decimal:2',
    ];

    public function getImageUrlAttribute(): string
    {
        return $this->getFirstMediaUrl('gallery', 'thumb') ?: $this->getFirstMediaUrl('gallery');
    }

    public function experience()
    {
        return $this->hasOne(AcquiredExperience::class);
    }

    public function artCollection()
    {
        return $this->belongsTo(ArtCollection::class);
    }

    public function reviews()
    {
        return $this->hasMany(EmotionalReview::class);
    }

    public function registerMediaConversions(?Media $media = null): void
    {
        $this->addMediaConversion('thumb')
             ->width(300)
             ->format('webp')
             ->nonQueued();

        $this->addMediaConversion('gallery')
             ->width(1200)
             ->format('webp')
             ->watermark(base_path('public/watermark.png'))
             ->withResponsiveImages()
             ->nonQueued();
    }
}
