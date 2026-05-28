<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;
    
    protected $keyType = 'string';
    public $incrementing = false;
    protected $guarded = [];

    public function subtasks()
    {
        return $this->hasMany(Subtask::class);
    }
}
