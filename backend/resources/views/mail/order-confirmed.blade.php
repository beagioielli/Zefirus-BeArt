{{-- backend/resources/views/mail/order-confirmed.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Compra Confirmada</title></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-size: 1.5rem; border-bottom: 1px solid #c9a96e; padding-bottom: 1rem;">Zefirus BeArt</h1>
    <p>Olá, <strong>{{ $order->buyer_name }}</strong>.</p>
    <p>Sua compra foi confirmada com sucesso.</p>
    <table style="width:100%; border-collapse: collapse; margin: 1.5rem 0;">
        <tr><td style="padding: 0.5rem; color: #666;">Obra</td><td>{{ $order->artwork->title }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Valor</td><td>R$ {{ number_format($order->amount, 2, ',', '.') }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Frete</td><td>R$ {{ number_format($order->shipping_cost ?? 0, 2, ',', '.') }}</td></tr>
        <tr><td style="padding: 0.5rem; color: #666;">Nº do Pedido</td><td>#{{ $order->id }}</td></tr>
    </table>
    <p>Prepararemos sua obra com todo o cuidado. Você receberá um e-mail quando ela for enviada.</p>
    <p style="margin-top: 2rem; color: #999; font-size: 0.85rem;">— Beatriz Gioielli · Zefirus BeArt</p>
</body>
</html>
