<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de verificação</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#0f172a;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
                    <tr>
                        <td style="background:#0f766e;padding:24px 32px;color:#ffffff;font-size:18px;font-weight:700;">
                            Central de Processos
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:32px;">
                            <p style="margin:0 0 12px;font-size:16px;">Olá, {{ $nome }} 👋</p>
                            <p style="margin:0 0 24px;font-size:14px;color:#475569;line-height:1.6;">
                                Use o código abaixo para concluir a criação da sua conta.
                                Ele expira em <strong>{{ $minutos }} minutos</strong>.
                            </p>
                            <div style="text-align:center;margin:0 0 24px;">
                                <span style="display:inline-block;background:#f0fdfa;border:1px dashed #14b8a6;color:#0f766e;font-size:34px;font-weight:700;letter-spacing:10px;padding:16px 24px;border-radius:12px;">
                                    {{ $codigo }}
                                </span>
                            </div>
                            <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.6;">
                                Se você não solicitou este cadastro, ignore este e-mail.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background:#f8fafc;padding:16px 32px;font-size:11px;color:#94a3b8;">
                            Central de Processos &middot; {{ date('Y') }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
