import { useEffect, useMemo, useState } from 'react';
import { aplicarMascara, MASCARAS_PADRAO } from './campos/mascaras.js';
import { avaliarCondicional, validarCampo } from './campos/regras.js';

/**
 * Componente único que renderiza qualquer tipo de campo do catálogo.
 * Recebe `todosValores` para resolver condicionais (ex: mostrar se outro campo == valor).
 */
export default function CampoDinamico({ campo, value, onChange, todosValores = {}, mapaCamposPorNome = null, soLeitura = false }) {
  const visivel = useMemo(
    () => avaliarCondicional(campo, todosValores, mapaCamposPorNome),
    [campo, todosValores, mapaCamposPorNome],
  );

  const [erro, setErro] = useState(null);

  useEffect(() => {
    if (visivel) {
      setErro(validarCampo(campo, value));
    } else {
      setErro(null);
    }
  }, [value, campo, visivel]);

  if (!visivel) return null;

  const id = `campo-${campo.id}`;
  const handleChange = v => {
    if (soLeitura) return;
    onChange(v);
  };

  return (
    <div>
      <label htmlFor={id} className="label">
        {campo.rotulo}
        {campo.obrigatorio && <span className="ml-1 text-red-500">*</span>}
      </label>
      <RenderInput campo={campo} value={value} onChange={handleChange} id={id} soLeitura={soLeitura} />
      {campo.ajuda && (
        <p className="mt-1 text-xs text-slate-400">{campo.ajuda}</p>
      )}
      {erro && (
        <p className="mt-1 text-xs text-red-600">{erro}</p>
      )}
    </div>
  );
}

function RenderInput({ campo, value, onChange, id, soLeitura }) {
  const regras = campo.regras ?? {};
  const baseClass = 'input';
  const disabled = soLeitura;

  const aplicarMaskHandler = mascara => e => {
    onChange(aplicarMascara(e.target.value, mascara));
  };

  switch (campo.tipo) {
    case 'texto':
      return (
        <input
          id={id} type="text" className={baseClass} disabled={disabled}
          required={campo.obrigatorio}
          value={value ?? ''} maxLength={regras.tamanho_max ?? undefined}
          onChange={e => onChange(e.target.value)}
        />
      );

    case 'texto_longo':
      return (
        <textarea
          id={id} className={`${baseClass} min-h-[100px] resize-y`} disabled={disabled}
          required={campo.obrigatorio}
          value={value ?? ''} maxLength={regras.tamanho_max ?? undefined}
          onChange={e => onChange(e.target.value)}
        />
      );

    case 'rich_text':
      return (
        <RichTextSimples value={value ?? ''} onChange={onChange} disabled={disabled} id={id} />
      );

    case 'email':
      return (
        <input
          id={id} type="email" className={baseClass} disabled={disabled}
          required={campo.obrigatorio} value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      );

    case 'url':
      return (
        <input
          id={id} type="url" className={baseClass} disabled={disabled}
          required={campo.obrigatorio} value={value ?? ''}
          placeholder="https://"
          onChange={e => onChange(e.target.value)}
        />
      );

    case 'telefone':
      return (
        <input
          id={id} type="text" className={baseClass} disabled={disabled}
          required={campo.obrigatorio} value={value ?? ''}
          placeholder="(11) 99999-9999"
          onChange={aplicarMaskHandler(regras.mascara || MASCARAS_PADRAO.telefone)}
        />
      );

    case 'cpf':
      return (
        <input
          id={id} type="text" className={baseClass} disabled={disabled} inputMode="numeric"
          required={campo.obrigatorio} value={value ?? ''} placeholder="000.000.000-00"
          onChange={aplicarMaskHandler(MASCARAS_PADRAO.cpf)}
        />
      );

    case 'cnpj':
      return (
        <input
          id={id} type="text" className={baseClass} disabled={disabled} inputMode="numeric"
          required={campo.obrigatorio} value={value ?? ''} placeholder="00.000.000/0000-00"
          onChange={aplicarMaskHandler(MASCARAS_PADRAO.cnpj)}
        />
      );

    case 'cep':
      return (
        <input
          id={id} type="text" className={baseClass} disabled={disabled} inputMode="numeric"
          required={campo.obrigatorio} value={value ?? ''} placeholder="00000-000"
          onChange={aplicarMaskHandler(MASCARAS_PADRAO.cep)}
        />
      );

    case 'numero':
      return (
        <input
          id={id} type="number" step="any" className={baseClass} disabled={disabled}
          required={campo.obrigatorio} value={value ?? ''}
          min={regras.min ?? undefined} max={regras.max ?? undefined}
          onChange={e => onChange(e.target.value)}
        />
      );

    case 'moeda':
      return (
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
          <input
            id={id} type="number" step="0.01" className={`${baseClass} pl-9`} disabled={disabled}
            required={campo.obrigatorio} value={value ?? ''}
            min={regras.min ?? 0}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      );

    case 'percentual':
      return (
        <div className="relative">
          <input
            id={id} type="number" step="0.01" className={`${baseClass} pr-9`} disabled={disabled}
            required={campo.obrigatorio} value={value ?? ''}
            min={regras.min ?? 0} max={regras.max ?? 100}
            onChange={e => onChange(e.target.value)}
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
        </div>
      );

    case 'data':
      return (
        <input
          id={id} type="date" className={baseClass} disabled={disabled}
          required={campo.obrigatorio} value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      );

    case 'datahora':
      return (
        <input
          id={id} type="datetime-local" className={baseClass} disabled={disabled}
          required={campo.obrigatorio} value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      );

    case 'selecao':
      return (
        <select
          id={id} className={baseClass} disabled={disabled}
          required={campo.obrigatorio} value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        >
          <option value="">Selecione...</option>
          {(campo.opcoes ?? []).map(op => (
            <option key={op} value={op}>{op}</option>
          ))}
        </select>
      );

    case 'multi_selecao':
      return <MultiSelecao campo={campo} value={value} onChange={onChange} disabled={disabled} />;

    case 'radio':
      return (
        <div className="flex flex-wrap gap-2">
          {(campo.opcoes ?? []).map(op => (
            <label
              key={op}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                value === op ? 'border-brand-400 bg-brand-50 text-brand-700' : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio" name={`r-${campo.id}`} value={op} disabled={disabled}
                checked={value === op}
                onChange={() => onChange(op)}
                className="h-3.5 w-3.5 text-brand-600"
              />
              {op}
            </label>
          ))}
        </div>
      );

    case 'booleano':
      return (
        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-3 py-2.5 text-sm hover:bg-slate-50">
          <input
            type="checkbox" id={id} disabled={disabled}
            checked={value === true || value === 'true' || value === '1'}
            onChange={e => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600"
          />
          {value === true || value === 'true' || value === '1' ? 'Sim' : 'Não'}
        </label>
      );

    case 'arquivo':
    case 'multi_arquivo':
      return <UploadArquivo campo={campo} value={value} onChange={onChange} disabled={disabled} />;

    case 'usuario':
    case 'multi_usuario':
      // Implementação simplificada — campo de texto com lista de e-mails.
      // Em produção, ligar a um autocomplete via /users.
      return (
        <input
          id={id} type="text" className={baseClass} disabled={disabled}
          placeholder={campo.tipo === 'multi_usuario' ? 'emails separados por vírgula' : 'email'}
          value={Array.isArray(value) ? value.join(', ') : value ?? ''}
          onChange={e => {
            const v = e.target.value;
            onChange(campo.tipo === 'multi_usuario' ? v.split(',').map(s => s.trim()).filter(Boolean) : v);
          }}
        />
      );

    case 'assinatura':
      // Stub — integração com canvas seria mais robusta.
      return (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3 text-center text-xs text-slate-500">
          {value ? '✓ Assinatura registrada' : 'Use o campo abaixo para colar uma imagem em base64'}
          <input
            id={id} type="text" className={`${baseClass} mt-2 text-xs`} disabled={disabled}
            placeholder="data:image/png;base64,..."
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
          />
        </div>
      );

    default:
      return (
        <input
          id={id} type="text" className={baseClass} disabled={disabled}
          required={campo.obrigatorio} value={value ?? ''}
          onChange={e => onChange(e.target.value)}
        />
      );
  }
}

// ── Subcomponentes ───────────────────────────────────────────────────────────

function MultiSelecao({ campo, value, onChange, disabled }) {
  const arr = Array.isArray(value) ? value : (value ? String(value).split(',') : []);
  const toggle = op => {
    if (disabled) return;
    onChange(arr.includes(op) ? arr.filter(x => x !== op) : [...arr, op]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {(campo.opcoes ?? []).map(op => {
        const ativo = arr.includes(op);
        return (
          <button
            key={op} type="button" onClick={() => toggle(op)} disabled={disabled}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              ativo ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {ativo ? '✓ ' : ''}{op}
          </button>
        );
      })}
    </div>
  );
}

function UploadArquivo({ campo, value, onChange, disabled }) {
  // Versão leve: armazena nome + base64 no valor. Para upload real, integraria com endpoint.
  const multi = campo.tipo === 'multi_arquivo';
  const arr = Array.isArray(value) ? value : (value ? [value] : []);

  const handleFile = async files => {
    const lista = await Promise.all(
      Array.from(files).map(f => new Promise(res => {
        const reader = new FileReader();
        reader.onload = () => res({ nome: f.name, tipo: f.type, tamanho: f.size, dados: reader.result });
        reader.readAsDataURL(f);
      })),
    );
    onChange(multi ? [...arr, ...lista] : lista[0]);
  };

  const remover = i => {
    if (multi) onChange(arr.filter((_, idx) => idx !== i));
    else onChange(null);
  };

  return (
    <div>
      <label className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-3 py-4 text-center text-xs text-slate-500 hover:bg-slate-100">
        <span>📎 Clique para selecionar {multi ? 'arquivos' : 'um arquivo'}</span>
        <input
          type="file" multiple={multi} className="hidden" disabled={disabled}
          onChange={e => handleFile(e.target.files)}
        />
      </label>
      {arr.length > 0 && (
        <ul className="mt-2 space-y-1 text-xs">
          {arr.map((f, i) => (
            <li key={i} className="flex items-center justify-between rounded bg-slate-50 px-2 py-1">
              <span className="truncate">{f.nome ?? 'arquivo'}</span>
              <button type="button" onClick={() => remover(i)} className="text-red-500">remover</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function RichTextSimples({ value, onChange, disabled, id }) {
  // Editor minimalista: textarea + barra com ações básicas via execCommand-equivalente.
  // Mantém HTML simples; suficiente para descrições. Para algo mais robusto, plugar TipTap/Quill.
  const inserir = tag => {
    const ta = document.getElementById(id);
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.substring(start, end);
    const novo = value.substring(0, start) + `<${tag}>${sel}</${tag}>` + value.substring(end);
    onChange(novo);
  };

  return (
    <div className="rounded-lg border border-slate-200">
      <div className="flex items-center gap-1 border-b border-slate-200 px-2 py-1">
        <button type="button" onClick={() => inserir('b')} className="rounded px-2 py-0.5 text-xs font-bold hover:bg-slate-100">B</button>
        <button type="button" onClick={() => inserir('i')} className="rounded px-2 py-0.5 text-xs italic hover:bg-slate-100">I</button>
        <button type="button" onClick={() => inserir('u')} className="rounded px-2 py-0.5 text-xs underline hover:bg-slate-100">U</button>
      </div>
      <textarea
        id={id} className="w-full min-h-[100px] resize-y bg-transparent px-3 py-2 text-sm font-mono outline-none"
        disabled={disabled} value={value} onChange={e => onChange(e.target.value)}
      />
    </div>
  );
}
