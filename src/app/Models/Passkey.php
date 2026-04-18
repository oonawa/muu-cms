<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Passkey extends Model
{
    const UPDATED_AT = null;

    protected $fillable = ['user_id', 'credential_id', 'public_key', 'sign_count'];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
