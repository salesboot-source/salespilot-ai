<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CompanyProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'company_name' => ['required', 'string', 'max:255'],
            'industry' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:5000'],
            'products_services' => ['required', 'array', 'min:1'],
            'products_services.*.name' => ['required', 'string', 'max:255'],
            'products_services.*.description' => ['required', 'string', 'max:1000'],
            'target_market' => ['nullable', 'string', 'max:2000'],
            'value_propositions' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function messages(): array
    {
        return [
            'company_name.required' => 'Company name is required.',
            'industry.required' => 'Industry is required.',
            'description.required' => 'Company description is required.',
            'products_services.required' => 'Add at least one product or service.',
            'products_services.min' => 'Add at least one product or service.',
            'products_services.*.name.required' => 'Product name is required.',
            'products_services.*.description.required' => 'Product description is required.',
        ];
    }
}
