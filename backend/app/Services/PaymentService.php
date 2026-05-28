<?php
// backend/app/Services/PaymentService.php

namespace App\Services;

use App\Models\Order;
use App\Models\Artwork;
use App\Models\AcquiredExperience;
use App\Mail\OrderConfirmed;
use App\Mail\BoletoGenerated;
use App\Mail\AdminNewSale;
use App\Mail\ExperienceReady;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;
use MercadoPago\MercadoPagoConfig;
use MercadoPago\Client\Payment\PaymentClient;

class PaymentService
{
    public function __construct()
    {
        MercadoPagoConfig::setAccessToken(config('services.mercadopago.access_token'));
    }

    public function createPayment(array $data): array
    {
        $client = new PaymentClient();

        $nameParts = explode(' ', $data['buyer_name']);
        $firstName = $nameParts[0];
        $lastName = count($nameParts) > 1 ? implode(' ', array_slice($nameParts, 1)) : $firstName;

        $paymentData = [
            'transaction_amount' => (float) ($data['amount'] + ($data['shipping_cost'] ?? 0)),
            'description'        => $data['artwork_title'],
            'external_reference' => (string) $data['artwork_id'],
            'payer'              => [
                'email'          => $data['buyer_email'],
                'first_name'     => $firstName,
                'last_name'      => $lastName,
                'identification' => [
                    'type'   => 'CPF',
                    'number' => preg_replace('/\D/', '', $data['buyer_cpf']),
                ],
                'address' => [
                    'zip_code'      => $data['billing_address']['zip_code'],
                    'street_name'   => $data['billing_address']['street'],
                    'street_number' => $data['billing_address']['number'] ?? 'S/N',
                ],
            ],
        ];

        if ($data['payment_method'] === 'card') {
            $paymentData['token']              = $data['card_token'];
            $paymentData['installments']       = (int) ($data['installments'] ?? 1);
            $paymentData['payment_method_id']  = $data['payment_method_id'];
        } elseif ($data['payment_method'] === 'pix') {
            $paymentData['payment_method_id']  = 'pix';
        } elseif ($data['payment_method'] === 'boleto') {
            $paymentData['payment_method_id']  = 'bolbradesco';
            $paymentData['additional_info']    = [
                'payer' => [
                    'first_name' => $firstName,
                    'last_name'  => $lastName,
                    'phone'      => ['number' => $data['buyer_phone']],
                    'address'    => [
                        'zip_code'      => $data['billing_address']['zip_code'],
                        'street_name'   => $data['billing_address']['street'],
                        'street_number' => $data['billing_address']['number'] ?? 'S/N',
                        'neighborhood'  => $data['billing_address']['neighborhood'] ?? '',
                        'city'          => $data['billing_address']['city'],
                        'federal_unit'  => $data['billing_address']['state'],
                    ],
                ],
            ];
        }

        $payment = $client->create($paymentData);

        $result = [
            'mp_payment_id'     => $payment->id,
            'status'            => $payment->status,
            'payment_method'    => $data['payment_method'],
        ];

        if ($data['payment_method'] === 'pix') {
            $txData = $payment->point_of_interaction->transaction_data ?? null;
            $result['pix_qr_code']      = $txData->qr_code_base64 ?? null;
            $result['pix_qr_code_text'] = $txData->qr_code ?? null;
        }

        if ($data['payment_method'] === 'boleto') {
            $result['boleto_url']     = $payment->transaction_details->external_resource_url ?? null;
            $result['boleto_barcode'] = $payment->barcode->content ?? null;
        }

        return $result;
    }

    public function validateWebhookSignature(Request $request): bool
    {
        $signature = $request->header('x-signature');
        $requestId = $request->header('x-request-id', '');

        if (!$signature) {
            return false;
        }

        $parts = [];
        foreach (explode(',', $signature) as $part) {
            $kv = explode('=', $part, 2);
            if (count($kv) === 2) {
                $parts[$kv[0]] = $kv[1];
            }
        }

        $ts = $parts['ts'] ?? '';
        $v1 = $parts['v1'] ?? '';

        if (!$ts || !$v1) {
            return false;
        }

        // Reject webhooks older than 5 minutes (replay-attack protection)
        if (abs(time() - (int) $ts) > 300) {
            return false;
        }

        $dataId  = $request->query('data_id', $request->input('data.id', ''));
        $secret  = config('services.mercadopago.webhook_secret');
        $manifest = "id:{$dataId};request-id:{$requestId};ts:{$ts};";
        $expected = hash_hmac('sha256', $manifest, $secret);

        return hash_equals($expected, $v1);
    }

    public function handleWebhook(Request $request): void
    {
        $topic  = $request->query('topic', $request->input('type', ''));
        $dataId = $request->query('data_id', $request->input('data.id', ''));

        if (in_array($topic, ['payment', 'payment.updated'])) {
            $this->handlePaymentWebhook((string) $dataId);
        } elseif ($topic === 'shipments') {
            $this->handleShipmentWebhook((string) $dataId);
        }
    }

    private function handlePaymentWebhook(string $mpPaymentId): void
    {
        // Idempotência: verifica se já foi processado como approved/rejected
        $order = Order::where('mp_payment_id', $mpPaymentId)->first();

        if (!$order || in_array($order->status, ['approved', 'rejected', 'cancelled'])) {
            return;
        }

        $client  = new PaymentClient();
        $payment = $client->get((int) $mpPaymentId);

        $order->update(['status' => $payment->status]);

        if ($payment->status === 'approved') {
            $this->onPaymentApproved($order);
        }
    }

    private function onPaymentApproved(Order $order): void
    {
        DB::transaction(function () use ($order) {
            // Marca obra como vendida
            Artwork::where('id', $order->artwork_id)->update(['is_sold' => true]);

            // Cria AcquiredExperience com campos ricos vazios
            $experience = AcquiredExperience::create([
                'artwork_id'  => $order->artwork_id,
                'buyer_name'  => $order->buyer_name,
                'unique_hash' => Str::uuid()->toString(),
            ]);

            $order->update(['acquired_experience_id' => $experience->id]);
        });

        // Emails (enfileirados)
        Mail::to($order->buyer_email)->queue(new OrderConfirmed($order));
        Mail::to(config('services.mercadopago.admin_email'))->queue(new AdminNewSale($order));
    }

    private function handleShipmentWebhook(string $shipmentId): void
    {
        $order = Order::where('mp_shipment_id', $shipmentId)->first();

        if (!$order) {
            Log::info("Shipment webhook received for unknown shipment_id: {$shipmentId}");
            return;
        }

        // Busca status real do envio via ML API
        $response = \Illuminate\Support\Facades\Http::withToken(
            config('services.mercadopago.access_token')
        )->get("https://api.mercadolibre.com/shipments/{$shipmentId}");

        if (!$response->ok()) {
            Log::warning("Failed to fetch shipment status from ML API", [
                'shipment_id' => $shipmentId,
                'status'      => $response->status(),
            ]);
            return;
        }

        $status = $response->json('status');
        $order->update(['shipping_status' => $status]);

        if ($status === 'delivered' && $order->acquiredExperience) {
            $experience = $order->acquiredExperience;

            // Só envia se o admin já preencheu o conteúdo (dedication é o indicador)
            if ($experience->dedication && !$order->experiencePublished()) {
                $order->update(['experience_published_at' => now()]);
                Mail::to($order->buyer_email)->queue(new ExperienceReady($order, $experience));
            }
        }
    }

    public function publishExperience(Order $order): void
    {
        $order->update(['experience_published_at' => now()]);
        Mail::to($order->buyer_email)->queue(new ExperienceReady($order, $order->acquiredExperience));
    }
}
