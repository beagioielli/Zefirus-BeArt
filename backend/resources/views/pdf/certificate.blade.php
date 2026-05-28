<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Certificado de Autenticidade</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; text-align: center; padding: 50px; color: #333; }
        .border { border: 2px solid #bba36d; padding: 40px; }
        h1 { color: #bba36d; font-size: 28px; text-transform: uppercase; letter-spacing: 2px; }
        p { font-size: 16px; margin: 20px 0; }
        .highlight { font-weight: bold; font-size: 18px; }
        .hash { font-family: monospace; font-size: 12px; color: #888; margin-top: 50px; }
        .signature { margin-top: 60px; border-top: 1px solid #333; display: inline-block; padding-top: 10px; width: 250px; }
    </style>
</head>
<body>
    <div class="border">
        <h1>Certificado de Autenticidade</h1>
        <p>Certificamos que a obra de arte original</p>
        <p class="highlight" style="font-size: 24px;">"{{ $artwork_title }}"</p>
        <p>Dimensões: {{ $artwork_dimensions }}</p>
        <p>Foi adquirida por</p>
        <p class="highlight">{{ $buyer_name }}</p>
        <p>Esta é uma criação original e autêntica de <span class="highlight">{{ $artist }}</span>.</p>
        
        <div class="signature">
            Assinatura do Artista
        </div>
        
        <p>Data de emissão: {{ $date }}</p>
        <p class="hash">Hash de Verificação: {{ $hash }}</p>
    </div>
</body>
</html>
