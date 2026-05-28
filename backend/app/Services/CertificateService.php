<?php

namespace App\Services;

use App\Models\AcquiredExperience;
use Barryvdh\DomPDF\Facade\Pdf;

class CertificateService
{
    public function generateCertificate(AcquiredExperience $experience)
    {
        $artwork = $experience->artwork;
        
        $data = [
            'buyer_name' => $experience->buyer_name,
            'artwork_title' => $artwork->title,
            'artwork_dimensions' => $artwork->dimensions,
            'artist' => 'Beatriz Gioielli',
            'date' => $experience->created_at->format('d/m/Y'),
            'hash' => $experience->unique_hash
        ];

        $pdf = Pdf::loadView('pdf.certificate', $data);
        
        // Add PDF to Artwork's 'certificates' collection
        $artwork->addMediaFromString($pdf->output())
            ->usingName("certificate_{$experience->unique_hash}")
            ->usingFileName("certificate_{$experience->unique_hash}.pdf")
            ->toMediaCollection('certificates');
            
        return true;
    }
}
