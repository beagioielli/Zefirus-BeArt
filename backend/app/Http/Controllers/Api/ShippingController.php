<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artwork;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class ShippingController extends Controller
{
    public function options(Request $request)
    {
        $request->validate([
            'artwork_id' => 'required|integer|exists:artworks,id',
            'zip_code'   => ['required', 'string', 'regex:/^\d{8}$/'],
        ]);

        $artwork = Artwork::findOrFail($request->artwork_id);

        if (!$artwork->shipping_weight || !$artwork->shipping_height || !$artwork->shipping_width || !$artwork->shipping_length) {
            return response()->json(['error' => 'Dados de embalagem não configurados para esta obra.'], 422);
        }

        $sellerZip   = config('services.mercadopago.seller_zip');
        $weightGrams = (int) ($artwork->shipping_weight * 1000);
        $dimensions  = "{$artwork->shipping_height}x{$artwork->shipping_width}x{$artwork->shipping_length},{$weightGrams}";

        // Busca seller_id via token
        $meResponse = Http::withToken(config('services.mercadopago.access_token'))
            ->get('https://api.mercadolibre.com/users/me');

        if (!$meResponse->ok()) {
            return response()->json(['error' => 'Falha ao autenticar com Mercado Envios.'], 503);
        }

        $sellerId = $meResponse->json('id');

        $shippingResponse = Http::withToken(config('services.mercadopago.access_token'))
            ->get("https://api.mercadolibre.com/users/{$sellerId}/shipping_options", [
                'zip_code'   => $request->zip_code,
                'dimensions' => $dimensions,
                'from'       => $sellerZip,
            ]);

        if (!$shippingResponse->ok()) {
            return response()->json(['error' => 'Não foi possível calcular o frete.'], 503);
        }

        $options = collect($shippingResponse->json('options') ?? [])
            ->map(fn ($opt) => [
                'id'             => $opt['id'],
                'name'           => $opt['name'],
                'cost'           => $opt['list_cost'] ?? $opt['cost'] ?? 0,
                'estimated_days' => $this->formatDelivery($opt['estimated_delivery_time'] ?? []),
            ])
            ->values();

        return response()->json($options);
    }

    private function formatDelivery(array $delivery): string
    {
        $unit  = $delivery['unit'] ?? 'hour';
        $lower = $delivery['offset']['lower'] ?? 0;
        $upper = $delivery['offset']['upper'] ?? 0;

        if ($unit === 'hour') {
            $lowerDays = (int) ceil($lower / 24);
            $upperDays = (int) ceil($upper / 24);
            return $lowerDays === $upperDays
                ? "{$lowerDays} dia(s) útil(eis)"
                : "{$lowerDays}-{$upperDays} dias úteis";
        }

        return $lower === $upper ? "{$lower} dia(s) útil(eis)" : "{$lower}-{$upper} dias úteis";
    }
}
