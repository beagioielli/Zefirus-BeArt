<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $guarded = [];

    protected $casts = [
        'amount'               => 'decimal:2',
        'shipping_cost'        => 'decimal:2',
        'billing_address'      => 'array',
        'shipping_address'     => 'array',
        'experience_published_at' => 'datetime',
    ];

    public function artwork()
    {
        return $this->belongsTo(Artwork::class);
    }

    public function acquiredExperience()
    {
        return $this->belongsTo(AcquiredExperience::class);
    }

    public function isApproved(): bool
    {
        return $this->status === 'approved';
    }

    public function experiencePublished(): bool
    {
        return $this->experience_published_at !== null;
    }
}
