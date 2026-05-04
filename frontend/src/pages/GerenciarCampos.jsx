import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { campoPermissoes as apiCampoPermissoes, campos as apiCampos, setores as apiSetores } from '../api/client.js';
import Breadcrumb from '../components/Breadcrumb.jsx';
import Modal from '../components/Modal.jsx';
import { TIPO_LABEL, TIPOS_AGRUPADOS, TIPOS_COM_OPCOES } from '../components/campos/catalogo.js';
import { useConfirm } from '../contexts/ConfirmContext.jsx';
import { useToast } from '../contexts/ToastContext.jsx';

const FORM_VAZIO = {
  nome: '',
  rotulo: '',
  tipo: 'texto',
  secao: '',
  coluna: 1,
  ajuda: '',
  opcoes: '',
  obrigatorio: false,
  // regras
  tamanho_max: '',
  min: '',
  max: '',
  valor_padrao: '',
  regex: '',
  regex_msg: '',
  cond_campo: '',
  cond_operador: '=',
  cond_valor: '',
};

export default function GerenciarCampos() {
  const { setorId } = useParams();

  const [setor, setSetor] = useState(null);
  const [campos, setCampos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(FORM_VAZIO);
  const [saving, setSaving] = useState(false);

  const [permModalOpen, setPermModalOpen] = useState(false);
  const [permCampo, setPermCampo] = useState(null);
  const [permList, setPermList] = useState([]);
  const [savingPerm, setSavingPerm] = useState(false);

  const toast = useToast();
  const confirm = useConfirm();

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        apiSetores.obter(setorId),
        apiCampos.listar(setorId),
      ]);
      setSetor(s);
      setCampos(c);
    } catch {
      toast('Erro ao carregar campos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [setorId]);

  const camposPossivelCondicional = useMemo(
    () => campos.filter(c => c.id !== editing?.id),
    [campos, editing],
  );

  const openNew = () => {
    setEditing(null);
    setForm(FORM_VAZIO);
    setModalOpen(true);
  };

  const openEdit = c => {
    setEditing(c);
    const r = c.regras ?? {};
    const cond = r.condicional?.regras?.[0] ?? {};
    setForm({
      nome: c.nome,
      rotulo: c.rotulo,
      tipo: c.tipo,
      secao: c.secao ?? '',
      coluna: c.coluna ?? 1,
      ajuda: c.ajuda ?? '',
      opcoes: (c.opcoes ?? []).join('\n'),
      obrigatorio: !!c.obrigatorio,
      tamanho_max: r.tamanho_max ?? '',
      min: r.min ?? '',
      max: r.max ?? '',
      valor_padrao: r.valor_padrao ?? '',
      regex: r.validacao?.regex ?? '',
      regex_msg: r.validacao?.mensagem ?? '',
      cond_campo: cond.campo ?? '',
      cond_operador: cond.operador ?? '=',
      cond_valor: cond.valor ?? '',
    });
    setModalOpen(true);
  };

  const montarRegras = () => {
    const regras = {};
    if (form.tamanho_max) regras.tamanho_max = Number(form.tamanho_max);
    if (form.min !== '') regras.min = Number(form.min);
    if (form.max !== '') regras.max = Number(form.max);
    if (form.valor_padrao) regras.valor_padrao = form.valor_padrao;
    if (form.regex) regras.validacao = { regex: form.regex, mensagem: form.regex_msg || undefined };
    if (form.cond_campo) {
      regras.condicional = {
        operador_logico: 'and',
        regras: [{
          campo: form.cond_campo,
          operador: form.cond_operador,
          valor: form.cond_valor,
        }],
      };
    }
    return Object.keys(regras).length > 0 ? regras : null;
  };

  const save = async e => {
    e.preventDefault();
    setSaving(true);
    const payload = {
      nome: form.nome,
      rotulo: form.rotulo,
      tipo: form.tipo,
      secao: form.secao || null,
      coluna: Number(form.coluna),
      ajuda: form.ajuda || null,
      obrigatorio: form.obrigatorio,
      opcoes: TIPOS_COM_OPCOES.includes(form.tipo)
        ? form.opcoes.split('\n').map(s => s.trim()).filter(Boolean)
        : null,
      regras: montarRegras(),
    };
    try {
      if (editing) {
        await apiCampos.atualizar(editing.id, payload);
        toast('Campo atualizado!');
      } else {
        await apiCampos.criar(setorId, payload);
        toast('Campo criado!');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      toast(err.response?.data?.message ?? 'Erro ao salvar campo.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const del = async c => {
    const ok = await confirm(
      `Excluir o campo "${c.rotulo}"? Os valores existentes serão removidos.`,
      'Excluir campo',
    );
    if (!ok) return;
    try {
      await apiCampos.remover(c.id);
      toast('Campo excluído.');
      load();
    } catch {
      toast('Erro ao excluir campo.', 'error');
    }
  };

  const openPermissoes = async c => {
    setPermCampo(c);
    setPermModalOpen(true);
    try {
      const list = await apiCampoPermissoes.listar(c.id);
      setPermList(list);
    } catch {
      toast('Erro ao carregar permissões.', 'error');
    }
  };

  const togglePerm = (papel, campo) => {
    setPermList(prev => prev.map(p => p.papel === papel ? { ...p, [campo]: !p[campo] } : p));
  };

  const savePerm = async () => {
    setSavingPerm(true);
    try {
      await apiCampoPermissoes.atualizar(permCampo.id, permList);
      toast('Permissões atualizadas!');
      setPermModalOpen(false);
    } catch {
      toast('Erro ao salvar permissões.', 'error');
    } finally {
      setSavingPerm(false);
    }
  };

  if (loading) return (
    <div className="space-y-6 animate-pulse">
      <div className="h-4 w-56 rounded bg-slate-200" />
      <div className="card p-6 space-y-3">
        <div className="h-7 w-72 rounded bg-slate-200" />
      </div>
    </div>
  );

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Setores', to: '/' },
          { label: setor?.nome ?? 'Setor', to: `/setores/${setorId}` },
          { label: 'Campos do formulário' },
        ]}
      />

      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Campos do formulário</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure os campos que compõem o formulário dos processos deste setor.
          </p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Novo campo</button>
      </div>

      <div className="card overflow-hidden">
        {campos.length === 0 ? (
          <div className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-3xl">🗂️</div>
            <p className="font-semibold text-slate-700">Nenhum campo cadastrado</p>
            <button className="btn-primary mt-5" onClick={openNew}>+ Novo campo</button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-4 py-3">Rótulo</th>
                <th className="px-4 py-3 hidden sm:table-cell">Nome</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3 hidden md:table-cell">Seção</th>
                <th className="px-4 py-3 hidden md:table-cell">Obrigatório</th>
                <th className="px-4 py-3 hidden lg:table-cell">Regras</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {campos.map(c => {
                const temRegras = c.regras && Object.keys(c.regras).length > 0;
                return (
                  <tr key={c.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.rotulo}</td>
                    <td className="px-4 py-3 hidden sm:table-cell font-mono text-xs text-slate-400">{c.nome}</td>
                    <td className="px-4 py-3"><span className="badge">{TIPO_LABEL[c.tipo] ?? c.tipo}</span></td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500 text-xs">{c.secao || '—'}</td>
                    <td className="px-4 py-3 hidden md:table-cell text-slate-500">{c.obrigatorio ? 'Sim' : 'Não'}</td>
                    <td className="px-4 py-3 hidden lg:table-cell text-xs text-slate-400">
                      {temRegras ? (
                        <div className="flex flex-wrap gap-1">
                          {c.regras.condicional && <span className="badge-gray">condicional</span>}
                          {c.regras.validacao?.regex && <span className="badge-gray">regex</span>}
                          {c.regras.tamanho_max && <span className="badge-gray">máx {c.regras.tamanho_max}</span>}
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => openPermissoes(c)}>Permissões</button>
                      <button className="btn-ghost px-2.5 py-1 text-xs" onClick={() => openEdit(c)}>Editar</button>
                      <button
                        className="btn-ghost px-2.5 py-1 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => del(c)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar campo' : 'Novo campo'}
        size="lg"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setModalOpen(false)}>Cancelar</button>
            <button className="btn-primary" form="campo-form" disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }
      >
        <form id="campo-form" onSubmit={save} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Rótulo *</label>
              <input
                className="input" required autoFocus
                value={form.rotulo}
                onChange={e => setForm({ ...form, rotulo: e.target.value })}
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="label">Nome técnico *</label>
              <input
                className="input font-mono text-xs" required
                pattern="^[a-zA-Z][a-zA-Z0-9_]*$"
                value={form.nome}
                onChange={e => setForm({ ...form, nome: e.target.value })}
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="label">Tipo *</label>
              <select
                className="input"
                value={form.tipo}
                onChange={e => setForm({ ...form, tipo: e.target.value })}
              >
                {Object.entries(TIPOS_AGRUPADOS).map(([grupo, tipos]) => (
                  <optgroup key={grupo} label={grupo}>
                    {tipos.map(t => (
                      <option key={t.value} value={t.value}>{t.icone} {t.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="col-span-1 sm:col-span-1">
              <label className="label">Seção</label>
              <input
                className="input"
                placeholder="ex: Dados Pessoais"
                value={form.secao}
                onChange={e => setForm({ ...form, secao: e.target.value })}
              />
            </div>

            <div className="col-span-1 sm:col-span-1">
              <label className="label">Coluna do form</label>
              <select
                className="input"
                value={form.coluna}
                onChange={e => setForm({ ...form, coluna: Number(e.target.value) })}
              >
                <option value={1}>Linha inteira</option>
                <option value={2}>Meia linha</option>
              </select>
            </div>
            <div className="col-span-1 sm:col-span-1">
              <label className="label">Texto de ajuda</label>
              <input
                className="input"
                placeholder="Aparece abaixo do campo"
                value={form.ajuda}
                onChange={e => setForm({ ...form, ajuda: e.target.value })}
              />
            </div>
          </div>

          {TIPOS_COM_OPCOES.includes(form.tipo) && (
            <div>
              <label className="label">Opções (uma por linha)</label>
              <textarea
                className="input min-h-[100px] resize-none font-mono text-xs"
                placeholder={'Opção 1\nOpção 2'}
                value={form.opcoes}
                onChange={e => setForm({ ...form, opcoes: e.target.value })}
              />
            </div>
          )}

          {/* Regras avançadas */}
          <details className="rounded-xl border border-slate-200 p-3">
            <summary className="cursor-pointer text-sm font-semibold text-slate-700">
              Regras avançadas (validação e condicional)
            </summary>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label text-xs">Tamanho máx (texto)</label>
                  <input
                    type="number" className="input"
                    value={form.tamanho_max}
                    onChange={e => setForm({ ...form, tamanho_max: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label text-xs">Mínimo (número)</label>
                  <input
                    type="number" className="input"
                    value={form.min}
                    onChange={e => setForm({ ...form, min: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label text-xs">Máximo (número)</label>
                  <input
                    type="number" className="input"
                    value={form.max}
                    onChange={e => setForm({ ...form, max: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="label text-xs">Valor padrão</label>
                <input
                  className="input"
                  value={form.valor_padrao}
                  onChange={e => setForm({ ...form, valor_padrao: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs">Regex de validação</label>
                  <input
                    className="input font-mono text-xs"
                    placeholder="^\\d{4}$"
                    value={form.regex}
                    onChange={e => setForm({ ...form, regex: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label text-xs">Mensagem de erro</label>
                  <input
                    className="input"
                    placeholder="Formato esperado..."
                    value={form.regex_msg}
                    onChange={e => setForm({ ...form, regex_msg: e.target.value })}
                  />
                </div>
              </div>

              <div className="rounded-lg bg-slate-50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Mostrar somente se…</p>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    className="input"
                    value={form.cond_campo}
                    onChange={e => setForm({ ...form, cond_campo: e.target.value })}
                  >
                    <option value="">Sem condição</option>
                    {camposPossivelCondicional.map(c => (
                      <option key={c.id} value={c.nome}>{c.rotulo}</option>
                    ))}
                  </select>
                  <select
                    className="input"
                    value={form.cond_operador}
                    onChange={e => setForm({ ...form, cond_operador: e.target.value })}
                  >
                    <option value="=">igual a</option>
                    <option value="!=">diferente de</option>
                    <option value=">">maior que</option>
                    <option value="<">menor que</option>
                    <option value="contem">contém</option>
                    <option value="preenchido">preenchido</option>
                    <option value="vazio">vazio</option>
                  </select>
                  <input
                    className="input"
                    placeholder="valor"
                    value={form.cond_valor}
                    disabled={['preenchido', 'vazio'].includes(form.cond_operador)}
                    onChange={e => setForm({ ...form, cond_valor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </details>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm text-slate-700 hover:bg-slate-50">
            <input
              type="checkbox"
              checked={form.obrigatorio}
              onChange={e => setForm({ ...form, obrigatorio: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-brand-600"
            />
            Campo obrigatório
          </label>
        </form>
      </Modal>

      <Modal
        open={permModalOpen}
        onClose={() => setPermModalOpen(false)}
        title={`Permissões do campo — ${permCampo?.rotulo ?? ''}`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setPermModalOpen(false)}>Cancelar</button>
            <button className="btn-primary" onClick={savePerm} disabled={savingPerm}>
              {savingPerm ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        }
      >
        <p className="mb-4 text-sm text-slate-500">
          Defina, por papel no setor, quem pode <strong>ver</strong> e <strong>editar</strong> este campo nos processos.
        </p>
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
            <tr>
              <th className="px-3 py-2">Papel</th>
              <th className="px-3 py-2 text-center">Pode ver</th>
              <th className="px-3 py-2 text-center">Pode editar</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {permList.map(p => (
              <tr key={p.papel}>
                <td className="px-3 py-2 capitalize font-medium text-slate-700">{p.papel}</td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    checked={p.pode_ver}
                    onChange={() => togglePerm(p.papel, 'pode_ver')}
                  />
                </td>
                <td className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-300 text-brand-600"
                    checked={p.pode_editar}
                    disabled={!p.pode_ver}
                    onChange={() => togglePerm(p.papel, 'pode_editar')}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-slate-400">
          Sem permissão configurada, o padrão é liberar para todos os papéis.
        </p>
      </Modal>
    </div>
  );
}
