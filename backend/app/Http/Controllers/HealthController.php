<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        return $this->success([
            'status' => 'healthy',
            'timestamp' => now()->toIso8601String(),
        ], 'SalesPilot API is running');
    }
}
