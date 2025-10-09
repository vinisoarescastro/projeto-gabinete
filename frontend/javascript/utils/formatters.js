/**
 * Funções de formatação de dados
 */

/**
 * Capitaliza a primeira letra de uma palavra
 * @param {string} palavra
 * @returns {string}
 */
export function capitalizar(palavra) {
    if (!palavra) return '';
    return palavra.charAt(0).toUpperCase() + palavra.slice(1).toLowerCase();
}

/**
 * Retorna apenas primeiro e último nome
 * @param {string} nomeCompleto
 * @returns {string}
 */
export function getNomeSobrenome(nomeCompleto) {
    if (!nomeCompleto) return 'Usuário';
    const partes = nomeCompleto.trim().split(' ');
    if (partes.length === 1) return partes[0];
    return `${partes[0]} ${partes[partes.length - 1]}`;
}

/**
 * Obtém iniciais do nome para avatar
 * @param {string} nomeCompleto
 * @returns {string}
 */
export function obterIniciais(nomeCompleto) {
    if (!nomeCompleto) return 'U';
    
    const nomes = nomeCompleto.trim().split(' ');
    
    if (nomes.length === 1) {
        return nomes[0].substring(0, 2).toUpperCase();
    }
    
    const primeiroNome = nomes[0];
    const ultimoNome = nomes[nomes.length - 1];
    return (primeiroNome.charAt(0) + ultimoNome.charAt(0)).toUpperCase();
}

/**
 * Formata data no padrão brasileiro (sem hora)
 * @param {string} dataISO
 * @returns {string}
 */
export function formatarData(dataISO) {
    if (!dataISO) return 'N/A';
    
    const data = new Date(dataISO);
    const opcoes = {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    };
    
    return data.toLocaleDateString('pt-BR', opcoes);
}

/**
 * Formata data com hora no padrão brasileiro
 * @param {string} dataISO
 * @returns {string}
 */
export function formatarDataHora(dataISO) {
    if (!dataISO) return 'N/A';
    
    const data = new Date(dataISO);
    const opcoes = {
        timeZone: 'America/Sao_Paulo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };
    
    return data.toLocaleString('pt-BR', opcoes);
}

/**
 * Converte quebras de linha em <br>
 * @param {string} texto
 * @returns {string}
 */
export function formatarTextoComQuebras(texto) {
    if (!texto) return 'Sem descrição';
    return texto.replace(/\n/g, '<br>');
}

/**
 * Aplica máscara de telefone brasileiro
 * @param {string} valor
 * @returns {string}
 */
export function aplicarMascaraTelefone(valor) {
    valor = valor.replace(/\D/g, '');
    
    if (valor.length <= 10) {
        valor = valor.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else {
        valor = valor.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
    }
    
    return valor;
}

/**
 * Remove formatação do telefone
 * @param {string} telefone
 * @returns {string}
 */
export function limparTelefone(telefone) {
    return telefone.replace(/\D/g, '');
}

/**
 * Formata tempo relativo de forma intuitiva
 * @param {string} dataISO
 * @returns {string}
 */
export function formatarTempoRelativo(dataISO) {
    if (!dataISO) return 'Nunca acessou';
    
    const agora = new Date();
    const data = new Date(dataISO);
    
    // Calcular diferença em milissegundos
    const diffMs = agora - data;
    const diffMinutos = Math.floor(diffMs / (1000 * 60));
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    // Se foi hoje (menos de 24h)
    if (diffDias === 0) {
        if (diffMinutos < 1) {
            return 'agora mesmo';
        } else if (diffMinutos < 60) {
            return `há ${diffMinutos}min`;
        } else if (diffHoras === 1) {
            const minutosRestantes = diffMinutos % 60;
            if (minutosRestantes === 0) {
                return 'há 1h';
            }
            return `há 1h ${minutosRestantes}min`;
        } else {
            const minutosRestantes = diffMinutos % 60;
            if (minutosRestantes === 0) {
                return `há ${diffHoras}h`;
            }
            return `há ${diffHoras}h ${minutosRestantes}min`;
        }
    }
    
    // Se foi em outro dia, mostrar data e hora
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const hora = String(data.getHours()).padStart(2, '0');
    const minuto = String(data.getMinutes()).padStart(2, '0');
    
    return `${dia}/${mes} às ${hora}:${minuto}`;
}