{{-- backend/resources/views/mail/experience-ready.blade.php --}}
<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><title>Sua obra chegou</title></head>
<body style="font-family: Georgia, serif; color: #2c2c2c; max-width: 600px; margin: 0 auto; padding: 2rem;">
    <h1 style="font-size: 1.5rem; border-bottom: 1px solid #c9a96e; padding-bottom: 1rem;">Zefirus BeArt</h1>
    <p>Olá, <strong>{{ $order->buyer_name }}</strong>.</p>
    <p>Sua obra <strong>{{ $order->artwork->title }}</strong> chegou ao seu destino.</p>
    <p>Preparamos uma experiência exclusiva para você — um espaço imersivo com a história, as intenções e a alma desta obra.</p>
    <p style="text-align: center; margin: 2rem 0;">
        <a href="{{ config('app.url') }}/experience/{{ $experience->unique_hash }}"
           style="background: #2c2c2c; color: #fff; padding: 1rem 2rem; text-decoration: none; display: inline-block; font-size: 1rem;">
            Acessar Minha Experiência
        </a>
    </p>
    <p style="color: #666; font-size: 0.9rem;">Guarde este link — ele é único e exclusivo para você.</p>
    <p style="margin-top: 2rem; color: #999; font-size: 0.85rem;">— Beatriz Gioielli · Zefirus BeArt</p>
</body>
</html>
