 export const formatarCPF = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2").slice(0, 14);
  };

export const formatarTelefone = (value: string) => {
    const digits = value.replace(/\D/g, "");
    const truncatedDigits = digits.slice(0, 11);
    let maskedValue = truncatedDigits.replace(/^(\d{2})(\d)/g, '($1) $2');
    maskedValue = maskedValue.replace(/(\d{5})(\d)/, '$1-$2');
    return maskedValue;
  };

export const formatarCNPJ = (value: string) => {
  return value
    .replace(/\D/g, "") // só numeros 
    .replace(/^(\d{2})(\d)/, "$1.$2") // Coloca ponto após os 2 primeiros dígitos
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3") // Coloca ponto após os 5 primeiros dígitos
    .replace(/\.(\d{3})(\d)/, ".$1/$2") // Coloca a barra após os 8 primeiros dígitos
    .replace(/(\d{4})(\d)/, "$1-$2") // Coloca o traço após os 12 primeiros dígitos
    .slice(0, 18); // Limita ao tamanho máximo do CNPJ (18 caracteres com máscara)
};