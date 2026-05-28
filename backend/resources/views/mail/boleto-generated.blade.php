{{-- backend/resources/views/mail/boleto-generated.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Boleto Gerado</title></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-size: 1.5rem; border-bottom: 1px solid #c9a96e; padding-bottom: 1rem;">Zefirus BeArt</h1>
    <p>Olá, <strong>{{ $order->buyer_name }}</strong>.</p>
    <p>Seu boleto para a obra <strong>{{ $order->artwork->title }}</strong> foi gerado.</p>
    <p><strong>Valor total:</strong> R$ {{ number_format($order->amount + ($order->shipping_cost ?? 0), 2, ',', '.') }}</p>
    @if($order->boleto_barcode)
    <p style="background: #f5f5f5; padding: 1rem; font-family: monospace; word-break: break-all;">
        {{ $order->boleto_barcode }}
    </p>
    @endif
    @if($order->boleto_url)
    <p><a href="{{ $order->boleto_url }}" style="background: #2c2c2c; color: #fff; padding: 0.75rem 1.5rem; text-decoration: none; display: inline-block;">Visualizar Boleto</a></p>
    @endif
    <p style="color: #666; font-size: 0.9rem;">O boleto vence em 3 dias úteis. Após o pagamento, a confirmação pode levar até 3 dias úteis.</p>
    <p style="margin-top: 2rem; color: #999; font-size: 0.85rem;">— Beatriz Gioielli · Zefirus BeArt</p>
</body>
</html>
