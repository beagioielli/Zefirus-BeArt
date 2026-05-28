<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Subtask extends Model
{
    use HasFactory;

    protected $keyType = 'string';
    public $incrementing = false;
    protected $guarded = [];

    // Caches to done as boolean properly
    protected $casts = [
        'done' => 'boolean'
    ];

    public function task()
    {
        return $this->belongsTo(Task::class);
    }
}
