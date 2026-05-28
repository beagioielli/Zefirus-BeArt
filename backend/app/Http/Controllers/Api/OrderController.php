<?php
// backend/app/Http/Controllers/Api/OrderController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Services\PaymentService;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function __construct(protected PaymentService $paymentService) {}

    // Público: polling de status para PIX/boleto
    public function status($id)
    {
        $order = Order::findOrFail($id);

        return response()->json([
            'order_id'        => $order->id,
            'status'          => $order->status,
            'payment_method'  => $order->mp_payment_method,
            'shipping_status' => $order->shipping_status,
            'experience_hash' => $order->acquiredExperience?->unique_hash,
        ]);
    }

    // Admin: lista pedidos
    public function index()
    {
        $orders = Order::with(['artwork:id,title', 'acquiredExperience:id,dedication,unique_hash'])
            ->latest()
            ->paginate(30);

        return response()->json($orders);
    }

    // Admin: detalhes de um pedido
    public function show($id)
    {
        $order = Order::with(['artwork', 'acquiredExperience'])->findOrFail($id);
        return response()->json($order);
    }

    // Admin: atualizar envio (tracking + status)
    public function updateShipping(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $data = $request->validate([
            'shipping_tracking_code' => 'nullable|string|max:100',
            'shipping_status'        => 'required|in:pending,shipped,delivered',
            'mp_shipment_id'         => 'nullable|string',
        ]);

        $order->update($data);

        return response()->json($order->fresh());
    }

    // Admin: preencher/publicar AcquiredExperience
    public function updateExperience(Request $request, $id)
    {
        $order = Order::with('acquiredExperience')->findOrFail($id);

        abort_unless($order->acquiredExperience, 404, 'Experiência não encontrada para este pedido.');

        $data = $request->validate([
            'dedication'         => 'nullable|string|max:2000',
            'creation_video_url' => 'nullable|url',
            'exhibition_history' => 'nullable|string|max:5000',
            'publish'            => 'boolean',
        ]);

        $order->acquiredExperience->update([
            'dedication'         => $data['dedication'] ?? $order->acquiredExperience->dedication,
            'creation_video_url' => $data['creation_video_url'] ?? $order->acquiredExperience->creation_video_url,
            'exhibition_history' => $data['exhibition_history'] ?? $order->acquiredExperience->exhibition_history,
        ]);

        if (!empty($data['publish']) && !$order->experiencePublished()) {
            $this->paymentService->publishExperience($order);
        }

        return response()->json($order->fresh()->load('acquiredExperience'));
    }
}
