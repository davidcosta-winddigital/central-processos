import { useEffect, useRef, useState } from 'react';
import { anexos as apiAnexos } from '../api/client.js';
import { useToast } from '../contexts/ToastContext.jsx';

const ALLOWED_TYPES = 'image/*,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function FileIcon({ tipo }) {
  if (tipo?.startsWith('image/')) return <span className="text-2xl">🖼️</span>;
  if (tipo === 'application/pdf') return <span className="text-2xl">📄</span>;
  return <span className="text-2xl">📝</span>;
}

export default function Anexos({ etapaId, isAdmin, title = 'Documentos e Arquivos', compact = false, initialFiles = null, onUpdated }) {
  const toast = useToast();
  const inputRef = useRef(null);

  const [arquivos, setArquivos] = useState(initialFiles ?? []);
  const [loading, setLoading]   = useState(initialFiles == null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver]   = useState(false);

  const load = async () => {
    if (!etapaId) return;
    try {
      const data = await apiAnexos.listarEtapa(etapaId);
      setArquivos(data);
      onUpdated?.(data);
    } catch {
      toast('Erro ao carregar arquivos.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setArquivos(initialFiles ?? []);
    setLoading(initialFiles == null);
  }, [initialFiles]);

  useEffect(() => {
    if (initialFiles == null) {
      load();
    }
  }, [etapaId, initialFiles]);

  const upload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of files) {
      try {
        const fd = new FormData();
        fd.append('arquivo', file);
        await apiAnexos.uploadEtapa(etapaId, fd);
        toast(`"${file.name}" enviado com sucesso!`);
      } catch (err) {
        toast(err.response?.data?.message ?? `Erro ao enviar "${file.name}".`, 'error');
      }
    }
    setUploading(false);
    load();
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragOver(false);
    upload([...e.dataTransfer.files]);
  };

  const remover = async (a) => {
    try {
      await apiAnexos.removerEtapa(a.id);
      toast('Arquivo removido.');
      const next = arquivos.filter(x => x.id !== a.id);
      setArquivos(next);
      onUpdated?.(next);
    } catch {
      toast('Erro ao remover arquivo.', 'error');
    }
  };

  const isImage = tipo => tipo?.startsWith('image/');

  return (
    <div className={compact ? 'space-y-4' : 'card p-6'}>
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <p className="mt-0.5 text-xs text-slate-400">Imagens, PDFs e Word — até 20 MB por arquivo</p>
        </div>
        {isAdmin && (
          <button
            className="btn-primary text-xs px-3 py-2"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Enviando...' : '+ Adicionar arquivo'}
          </button>
        )}
      </div>

      {/* Drop zone (admin only) */}
      {isAdmin && (
        <div
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed ${compact ? 'py-5 px-4' : 'py-8 px-4'} text-center transition-colors cursor-pointer select-none ${
            dragOver
              ? 'border-brand-500 bg-brand-50'
              : uploading
              ? 'border-brand-300 bg-brand-50/50'
              : 'border-slate-200 hover:border-brand-300 hover:bg-slate-50'
          }`}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => !uploading && inputRef.current?.click()}
        >
          <div className="mb-2 text-3xl">{uploading ? '⏳' : '📁'}</div>
          <p className="text-sm font-medium text-slate-600">
            {uploading ? 'Enviando arquivos...' : 'Arraste e solte arquivos aqui'}
          </p>
          {!uploading && (
            <p className="mt-1 text-xs text-slate-400">ou clique para selecionar</p>
          )}
          <input
            ref={inputRef}
            type="file"
            className="hidden"
            multiple
            accept={ALLOWED_TYPES}
            onChange={e => { upload([...e.target.files]); e.target.value = ''; }}
            disabled={uploading}
          />
        </div>
      )}

      {/* File list */}
      {loading ? (
        <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {[1, 2].map(i => (
            <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-slate-50 h-44" />
          ))}
        </div>
      ) : arquivos.length === 0 ? (
        <div className="flex flex-col items-center py-10 text-center">
          <p className="text-sm text-slate-400">Nenhum arquivo anexado ainda.</p>
          {isAdmin && <p className="mt-1 text-xs text-slate-300">Use a área acima para adicionar.</p>}
        </div>
      ) : (
        <div className={`grid gap-3 ${compact ? 'sm:grid-cols-2' : 'sm:grid-cols-2 lg:grid-cols-3'}`}>
          {arquivos.map(a => (
            <div
              key={a.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:shadow-card-hover transition-shadow"
            >
              {/* Preview */}
              {isImage(a.tipo_mime) ? (
                <div className="h-36 overflow-hidden bg-slate-100">
                  <img
                    src={a.url}
                    alt={a.nome_original}
                    className="h-full w-full object-cover"
                    onError={e => { e.currentTarget.parentElement.innerHTML = '<div class="h-full flex items-center justify-center text-3xl">🖼️</div>'; }}
                  />
                </div>
              ) : (
                <div className="flex h-20 items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100">
                  <FileIcon tipo={a.tipo_mime} />
                </div>
              )}

              {/* Info */}
              <div className="flex flex-1 flex-col p-3">
                <p className="truncate text-sm font-semibold text-slate-800" title={a.nome_original}>
                  {a.nome_original}
                </p>
                <p className="text-xs text-slate-400">{formatSize(a.tamanho)}</p>

                <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-2">
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-brand-600 hover:text-brand-800 hover:underline"
                  >
                    Abrir
                  </a>
                  <a
                    href={a.url}
                    download={a.nome_original}
                    className="text-xs text-slate-500 hover:text-slate-700 hover:underline"
                  >
                    Baixar
                  </a>
                  {isAdmin && (
                    <button
                      className="ml-auto text-xs text-red-400 hover:text-red-600 transition-colors"
                      onClick={() => remover(a)}
                    >
                      Remover
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
