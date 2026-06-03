<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class InfraAccess
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->temAcessoInfra()) {
            return response()->json([
                'message' => 'Acesso restrito a administradores do setor de Tecnologia.',
            ], 403);
        }

        return $next($request);
    }
}
