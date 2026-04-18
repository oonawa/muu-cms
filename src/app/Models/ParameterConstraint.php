<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ParameterConstraint extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['parameter_id', 'max_length'];

    public function parameter(): BelongsTo
    {
        return $this->belongsTo(Parameter::class);
    }
}
