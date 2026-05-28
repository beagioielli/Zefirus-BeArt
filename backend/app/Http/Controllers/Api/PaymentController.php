<?php
// backend/app/Http/Controllers/Api/PaymentController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Artwork;
use App\Models\Order;
use App\Services\PaymentService;
use App\Mail\BoletoGenerated;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;

class PaymentController extends Controller
{
    public function __construct(protected PaymentService $paymentService) {}

    public function checkout(Request $request)
    {
        $data = $request->validate([
            'artwork_id'        => 'required|integer|exists:artworks,id',
            'payment_method'    => 'required|in:card,pix,boleto',
            'buyer_name'        => 'required|string|max:255',
            'buyer_email'       => 'required|email',
            'buyer_cpf'         => ['required', 'string', 'regex:/^(\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11})$/'],
            'buyer_phone'       => 'required|string|max:20',
            'buyer_message'     => 'nullable|string|max:1000',
            'billing_address'   => 'required|array',
            'billing_address.zip_code'     => 'required|string',
            'billing_address.street'       => 'required|string',
            'billing_address.number'       => 'required|string',
            'billing_address.neighborhood' => 'required|string',
            'billing_address.city'         => 'required|string',
            'billing_address.state'        => 'required|string|size:2',
            'shipping_address'  => 'required|array',
            'shipping_address.zip_code'     => 'required|string',
            'shipping_address.street'       => 'required|string',
            'shipping_address.number'       => 'required|string',
            'shipping_address.neighborhood' => 'required|string',
            'shipping_address.city'         => 'required|string',
            'shipping_address.state'        => 'required|string|size:2',
            'shipping_option'   => 'required|string',
            'shipping_cost'     => 'required|numeric|min:0',
            // Card-specific
            'card_token'        => 'required_if:payment_method,card|string',
            'payment_method_id' => 'required_if:payment_method,card|string',
            'installments'      => 'nullable|integer|min:1|max:12',
        ]);

        $artwork = DB::transaction(function () use ($data) {
            $artwork = Artwork::lockForUpdate()->findOrFail($data['artwork_id']);

            if ($artwork->is_sold) {
                abort(409, 'Obra não disponível.');
            }

            return $artwork;
        });

        $paymentResult = $this->paymentService->createPayment(array_merge($data, [
            'artwork_title' => $artwork->title,
            'amount'        => $artwork->price,
        ]));

        $order = Order::create([
            'artwork_id'         => $artwork->id,
            'mp_payment_id'      => $paymentResult['mp_payment_id'],
            'mp_payment_method'  => $data['payment_method'],
            'status'             => $paymentResult['status'],
            'amount'             => $artwork->price,
            'shipping_cost'      => $data['shipping_cost'],
            'buyer_name'         => $data['buyer_name'],
            'buyer_email'        => $data['buyer_email'],
            'buyer_cpf'          => $data['buyer_cpf'],
            'buyer_phone'        => $data['buyer_phone'],
            'buyer_message'      => $data['buyer_message'] ?? null,
            'billing_address'    => $data['billing_address'],
            'shipping_address'   => $data['shipping_address'],
            'shipping_option'    => $data['shipping_option'],
            'shipping_status'    => 'pending',
            'pix_qr_code'        => $paymentResult['pix_qr_code'] ?? null,
            'pix_qr_code_text'   => $paymentResult['pix_qr_code_text'] ?? null,
            'boleto_url'         => $paymentResult['boleto_url'] ?? null,
            'boleto_barcode'     => $paymentResult['boleto_barcode'] ?? null,
        ]);

        if ($data['payment_method'] === 'boleto') {
            Mail::to($data['buyer_email'])->queue(new BoletoGenerated($order));
        }

        return response()->json([
            'order_id'         => $order->id,
            'status'           => $order->status,
            'payment_method'   => $order->mp_payment_method,
            'pix_qr_code'      => $order->pix_qr_code,
            'pix_qr_code_text' => $order->pix_qr_code_text,
            'boleto_url'       => $order->boleto_url,
            'boleto_barcode'   => $order->boleto_barcode,
        ], 201);
    }

    public function webhook(Request $request)
    {
        if (!$this->paymentService->validateWebhookSignature($request)) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        $this->paymentService->handleWebhook($request);

        return response()->json(['message' => 'ok']);
    }
}
