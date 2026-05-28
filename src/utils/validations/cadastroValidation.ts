export const limparCPF = (cpf: string) => cpf.replace(/\D/g, "");

export const validarCPF = (cpf: string) => {
    cpf = limparCPF(cpf);
    if (cpf.length!== 11 || /^(\d)\1+$/.test(cpf)) return false;
    let soma = 0, resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpf.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto!== parseInt(cpf.substring(9, 10))) return false;
    soma = 0;
    for (let i = 1; i <= 10; i++) soma += parseInt(cpf.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    return resto === parseInt(cpf.substring(10, 11));
  };

export const validarIdade = (data: string) => {
    if (!data) return false;
    const hoje = new Date();
    const nasc = new Date(data);
    let idade = hoje.getFullYear() - nasc.getFullYear();
    const m = hoje.getMonth() - nasc.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) {
      idade--;
    }
    return idade >= 18;
  };

export  const validarTelefone = (telefone: string) => {
    const digits = telefone.replace(/\D/g, "");
    if (digits.length!== 11) return false;
    if (/^(\d)\1+$/.test(digits)) return false;
    return true;
  }

export const validarCNPJ = (cnpj: string) => {
  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/\D/g, "");

  // Verifica se tem 14 dígitos ou se todos os dígitos são iguais (ex: 00000000000000)
  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;

  // Validação dos dois dígitos verificadores
  const validarDigito = (fatia: string) => {
    let tamanho = fatia.length;
    let soma = 0;
    let pos = tamanho - 7;

    for (let i = tamanho; i >= 1; i--) {
      soma += parseInt(fatia.charAt(tamanho - i)) * pos--;
      if (pos < 2) pos = 9;
    }

    const resultado = soma % 11 < 2 ? 0 : 11 - (soma % 11);
    return resultado;
  };

  // Primeiro dígito (baseado nos 12 primeiros números)
  const digito1 = validarDigito(cnpj.substring(0, 12));
  if (digito1 !== parseInt(cnpj.substring(12, 13))) return false;

  // Segundo dígito (baseado nos 13 primeiros números)
  const digito2 = validarDigito(cnpj.substring(0, 13));
  if (digito2 !== parseInt(cnpj.substring(13, 14))) return false;

  return true;
};
 
export const limparCNPJ = (cnpj: string) => cnpj.replace(/\D/g, "");