// Catálogo único de tipos de campo. Cada entrada vira opção no Form Builder
// e mapeia para o renderer/serializer apropriados.

export const TIPO_CATALOGO = [
  { value: 'texto',         label: 'Texto curto',        grupo: 'Texto',     icone: '✏️' },
  { value: 'texto_longo',   label: 'Texto longo',        grupo: 'Texto',     icone: '📝' },
  { value: 'rich_text',     label: 'Texto formatado',    grupo: 'Texto',     icone: '📰' },
  { value: 'email',         label: 'E-mail',             grupo: 'Texto',     icone: '✉️' },
  { value: 'telefone',      label: 'Telefone',           grupo: 'Texto',     icone: '📞' },
  { value: 'cpf',           label: 'CPF',                grupo: 'Texto',     icone: '🪪' },
  { value: 'cnpj',          label: 'CNPJ',               grupo: 'Texto',     icone: '🏢' },
  { value: 'cep',           label: 'CEP',                grupo: 'Texto',     icone: '📮' },
  { value: 'url',           label: 'URL',                grupo: 'Texto',     icone: '🔗' },

  { value: 'numero',        label: 'Número',             grupo: 'Número',    icone: '🔢' },
  { value: 'moeda',         label: 'Moeda (R$)',         grupo: 'Número',    icone: '💰' },
  { value: 'percentual',    label: 'Percentual',         grupo: 'Número',    icone: '📊' },

  { value: 'data',          label: 'Data',               grupo: 'Data',      icone: '📅' },
  { value: 'datahora',      label: 'Data e hora',        grupo: 'Data',      icone: '🕒' },

  { value: 'selecao',       label: 'Seleção (dropdown)', grupo: 'Escolha',   icone: '📌',  precisaOpcoes: true },
  { value: 'multi_selecao', label: 'Múltipla escolha',   grupo: 'Escolha',   icone: '🗂️', precisaOpcoes: true },
  { value: 'radio',         label: 'Botões de rádio',    grupo: 'Escolha',   icone: '🔘',  precisaOpcoes: true },
  { value: 'booleano',      label: 'Sim/Não',            grupo: 'Escolha',   icone: '✔️' },

  { value: 'arquivo',       label: 'Arquivo (1)',        grupo: 'Arquivo',   icone: '📎' },
  { value: 'multi_arquivo', label: 'Vários arquivos',    grupo: 'Arquivo',   icone: '📁' },

  { value: 'usuario',       label: 'Usuário',            grupo: 'Pessoas',   icone: '👤' },
  { value: 'multi_usuario', label: 'Vários usuários',    grupo: 'Pessoas',   icone: '👥' },

  { value: 'assinatura',    label: 'Assinatura',         grupo: 'Avançado',  icone: '✍️' },
];

export const TIPO_LABEL = Object.fromEntries(
  TIPO_CATALOGO.map(t => [t.value, t.label]),
);

export const TIPOS_COM_OPCOES = TIPO_CATALOGO
  .filter(t => t.precisaOpcoes)
  .map(t => t.value);

export const TIPOS_AGRUPADOS = TIPO_CATALOGO.reduce((acc, t) => {
  acc[t.grupo] ??= [];
  acc[t.grupo].push(t);
  return acc;
}, {});

/** Tipos que serializam como JSON ao salvar. */
export const TIPOS_JSON = ['multi_selecao', 'multi_arquivo', 'multi_usuario', 'arquivo'];
