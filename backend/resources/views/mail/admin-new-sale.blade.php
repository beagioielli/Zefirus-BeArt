{{-- backend/resources/views/mail/admin-new-sale.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Nova Venda</title></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-size: 1.5rem; border-bottom: 1px solid #c9a96e; padding-bottom: 1rem;">Nova Venda — Zefirus BeArt</h1>
    <table style="width:100%; border-collapse: collapse; margin: 1.5rem 0;">
        <tr><td style="padding: 0.5rem; color: #666;">Obra</td><td>{{ $order->artwork->title }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Comprador</td><td>{{ $order->buyer_name }} ({{ $order->buyer_email }})</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Telefone</td><td>{{ $order->buyer_phone }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Valor</td><td>R$ {{ number_format($order->amount, 2, ',', '.') }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Frete</td><td>R$ {{ number_format($order->shipping_cost ?? 0, 2, ',', '.') }} ({{ $order->shipping_option }})</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Método</td><td>{{ strtoupper($order->mp_payment_method) }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Pedido #</td><td>{{ $order->id }}</td></tr>
        @if($order->buyer_message)
        <tr><td style="padding: 0.5rem; color: #666;">Mensagem</td><td><em>{{ $order->buyer_message }}</em></td></tr>
        @endif
    </table>
    <p style="color: #666;">Endereço de entrega: {{ $order->shipping_address['street'] }}, {{ $order->shipping_address['number'] }} — {{ $order->shipping_address['city'] }}/{{ $order->shipping_address['state'] }}, CEP {{ $order->shipping_address['zip_code'] }}</p>
</body>
</html>
