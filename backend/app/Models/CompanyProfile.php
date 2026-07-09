<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class CompanyProfile extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'company_name',
        'industry',
        'description',
        'products_services',
        'target_market',
        'value_propositions',
    ];

    protected function casts(): array
    {
        return [
            'products_services' => 'array',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
