<?php

namespace App\Http\Controllers;

use App\Http\Requests\CompanyProfileRequest;
use App\Models\CompanyProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CompanyProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $profile = $request->user()->companyProfile;

        if (!$profile) {
            return $this->success(null, 'No company profile yet');
        }

        return $this->success([
            'id' => $profile->id,
            'company_name' => $profile->company_name,
            'industry' => $profile->industry,
            'description' => $profile->description,
            'products_services' => $profile->products_services,
            'target_market' => $profile->target_market,
            'value_propositions' => $profile->value_propositions,
            'updated_at' => $profile->updated_at,
        ]);
    }

    public function store(CompanyProfileRequest $request): JsonResponse
    {
        $user = $request->user();

        $profile = CompanyProfile::updateOrCreate(
            ['user_id' => $user->id],
            [
                'company_name' => $request->company_name,
                'industry' => $request->industry,
                'description' => $request->description,
                'products_services' => $request->products_services,
                'target_market' => $request->target_market,
                'value_propositions' => $request->value_propositions,
            ]
        );

        return $this->success([
            'id' => $profile->id,
            'company_name' => $profile->company_name,
            'industry' => $profile->industry,
            'description' => $profile->description,
            'products_services' => $profile->products_services,
            'target_market' => $profile->target_market,
            'value_propositions' => $profile->value_propositions,
            'updated_at' => $profile->updated_at,
        ], 'Company profile saved successfully');
    }
}
