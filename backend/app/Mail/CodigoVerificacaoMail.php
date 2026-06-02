<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CodigoVerificacaoMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $nome,
        public string $codigo,
        public int $minutos = 15,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Seu código de verificação · Central de Processos',
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.codigo-verificacao',
        );
    }
}
