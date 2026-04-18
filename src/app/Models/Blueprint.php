<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Blueprint extends Model
{
    protected $fillable = ['space_id', 'slug', 'name', 'type'];

    public function space(): BelongsTo
    {
        return $this->belongsTo(Space::class);
    }

    public function spec(): HasOne
    {
        return $this->hasOne(Spec::class);
    }

    public function contents(): HasMany
    {
        return $this->hasMany(Content::class);
    }
}
