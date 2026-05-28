<?php
// backend/app/Mail/ExperienceReady.php

namespace App\Mail;

use App\Models\AcquiredExperience;
use App\Models\Order;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ExperienceReady extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public Order $order,
        public AcquiredExperience $experience
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: 'Sua obra chegou — Acesse sua Experiência exclusiva');
    }

    public function content(): Content
    {
        return new Content(view: 'mail.experience-ready');
    }
}
