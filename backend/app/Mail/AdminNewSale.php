<?php
// backend/app/Mail/AdminNewSale.php

namespace App\Mail;

use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class AdminNewSale extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Order $order) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Nova venda — ' . $this->order->artwork->title);
    }

    public function content(): Content
    {
        return new Content(view: 'mail.admin-new-sale');
    }
}
