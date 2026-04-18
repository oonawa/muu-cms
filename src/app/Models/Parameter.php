<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Parameter extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['spec_id', 'name', 'label', 'type', 'is_required', 'sort_order'];

    public function spec(): BelongsTo
    {
        return $this->belongsTo(Spec::class);
    }

    public function constraint(): HasOne
    {
        return $this->hasOne(ParameterConstraint::class);
    }
}
