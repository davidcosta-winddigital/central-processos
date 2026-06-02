<?php

namespace Database\Seeders;

use App\Models\CampoPersonalizado;
use App\Models\Etapa;
use App\Models\Processo;
use App\Models\Setor;
use App\Models\User;
use App\Models\ValorCampo;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $rh = Setor::create([
            'nome' => 'Recursos Humanos',
            'descricao' => 'Responsável por admissões, desligamentos e folha.',
        ]);

        $ti = Setor::create([
            'nome' => 'Tecnologia da Informação',
            'descricao' => 'Infraestrutura, suporte e desenvolvimento interno.',
        ]);

        $financeiro = Setor::create([
            'nome' => 'Financeiro',
            'descricao' => 'Contas a pagar, a receber e conciliações bancárias.',
        ]);

        $campoResponsavel = CampoPersonalizado::create([
            'setor_id' => $rh->id,
            'nome' => 'responsavel',
            'rotulo' => 'Responsável',
            'tipo' => 'texto',
            'obrigatorio' => true,
            'ordem' => 0,
        ]);

        $campoSla = CampoPersonalizado::create([
            'setor_id' => $rh->id,
            'nome' => 'sla_dias',
            'rotulo' => 'SLA (em dias)',
            'tipo' => 'numero',
            'ordem' => 1,
        ]);

        CampoPersonalizado::create([
            'setor_id' => $rh->id,
            'nome' => 'prioridade',
            'rotulo' => 'Prioridade',
            'tipo' => 'selecao',
            'opcoes' => ['Baixa', 'Média', 'Alta', 'Crítica'],
            'obrigatorio' => true,
            'ordem' => 2,
        ]);

        CampoPersonalizado::create([
            'setor_id' => $ti->id,
            'nome' => 'ambiente',
            'rotulo' => 'Ambiente',
            'tipo' => 'selecao',
            'opcoes' => ['Desenvolvimento', 'Homologação', 'Produção'],
            'obrigatorio' => true,
            'ordem' => 0,
        ]);

        CampoPersonalizado::create([
            'setor_id' => $ti->id,
            'nome' => 'data_revisao',
            'rotulo' => 'Data da próxima revisão',
            'tipo' => 'data',
            'ordem' => 1,
        ]);

        CampoPersonalizado::create([
            'setor_id' => $financeiro->id,
            'nome' => 'centro_custo',
            'rotulo' => 'Centro de Custo',
            'tipo' => 'texto',
            'obrigatorio' => true,
            'ordem' => 0,
        ]);

        $admissao = Processo::create([
            'setor_id' => $rh->id,
            'titulo' => 'Admissão de novo colaborador',
            'descricao' => 'Fluxo completo de contratação, da proposta à integração.',
        ]);

        foreach ([
            ['Envio da proposta de admissão', 'Encaminhar proposta formalizada ao candidato.'],
            ['Coleta de documentos obrigatórios', 'RG, CPF, comprovante de residência, CTPS.'],
            ['Abertura de conta no banco', 'Processo com banco parceiro.'],
            ['Cadastro no sistema de RH', 'Incluir dados no Protheus/RH.'],
            ['Integração e boas-vindas', 'Treinamento inicial com gestores.'],
        ] as $i => [$titulo, $desc]) {
            Etapa::create([
                'processo_id' => $admissao->id,
                'titulo' => $titulo,
                'descricao' => $desc,
                'ordem' => $i,
            ]);
        }

        ValorCampo::create([
            'processo_id' => $admissao->id,
            'campo_personalizado_id' => $campoResponsavel->id,
            'valor' => 'Maria do RH',
        ]);
        ValorCampo::create([
            'processo_id' => $admissao->id,
            'campo_personalizado_id' => $campoSla->id,
            'valor' => '5',
        ]);

        $deploy = Processo::create([
            'setor_id' => $ti->id,
            'titulo' => 'Deploy de aplicação',
            'descricao' => 'Procedimento padrão para subir nova versão.',
        ]);

        foreach ([
            ['Revisar pull requests', 'Garantir aprovação de ao menos 2 revisores.'],
            ['Executar testes automatizados', 'Rodar pipeline completa.'],
            ['Build e versionamento', 'Tag seguindo semver.'],
            ['Deploy em homologação', 'Validar com QA e stakeholders.'],
            ['Deploy em produção', 'Janela de mudança aprovada pelo gestor.'],
        ] as $i => [$titulo, $desc]) {
            Etapa::create([
                'processo_id' => $deploy->id,
                'titulo' => $titulo,
                'descricao' => $desc,
                'ordem' => $i,
            ]);
        }

        $pagamento = Processo::create([
            'setor_id' => $financeiro->id,
            'titulo' => 'Pagamento a fornecedores',
            'descricao' => 'Rotina semanal de pagamentos.',
        ]);

        foreach ([
            ['Conferência das notas fiscais', 'Checar divergências com o pedido.'],
            ['Aprovação do gestor responsável', 'Via sistema de workflow.'],
            ['Agendamento bancário', 'Emitir pagamento via conta corrente.'],
            ['Arquivamento do comprovante', 'Anexar no ERP.'],
        ] as $i => [$titulo, $desc]) {
            Etapa::create([
                'processo_id' => $pagamento->id,
                'titulo' => $titulo,
                'descricao' => $desc,
                'ordem' => $i,
            ]);
        }

        // ── Administrador principal ─────────────────────────────────────────────
        User::updateOrCreate(
            ['email' => 'david.costa@winddigital.com.br'],
            ['name' => 'David Costa', 'password' => Hash::make('admin'), 'role' => 'admin']
        );

        // ── Usuários demo com papéis distintos por setor ────────────────────────
        $admin = User::firstOrCreate(
            ['email' => 'admin@local'],
            ['name' => 'Administrador', 'password' => Hash::make('admin123'), 'role' => 'admin']
        );

        $manager = User::firstOrCreate(
            ['email' => 'gestor.rh@local'],
            ['name' => 'Maria Gestora (RH)', 'password' => Hash::make('senha123'), 'role' => 'user']
        );
        $manager->setores()->syncWithoutDetaching([
            $rh->id => ['papel' => 'manager'],
        ]);

        $editor = User::firstOrCreate(
            ['email' => 'analista.ti@local'],
            ['name' => 'João Analista (TI)', 'password' => Hash::make('senha123'), 'role' => 'user']
        );
        $editor->setores()->syncWithoutDetaching([
            $ti->id  => ['papel' => 'editor'],
            $rh->id  => ['papel' => 'viewer'],
        ]);

        $viewer = User::firstOrCreate(
            ['email' => 'consulta@local'],
            ['name' => 'Carla Consulta', 'password' => Hash::make('senha123'), 'role' => 'user']
        );
        $viewer->setores()->syncWithoutDetaching([
            $financeiro->id => ['papel' => 'viewer'],
            $rh->id         => ['papel' => 'viewer'],
        ]);
    }
}
