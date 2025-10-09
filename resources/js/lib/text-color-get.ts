/**
 * Retorna uma cor hexadecimal baseada na primeira letra de um texto
 * @param text - O texto para obter a cor
 * @returns Uma string hexadecimal representando a cor
 */
export function getTextColor(text: string): string {
  if (!text || text.length === 0) {
    return '#6B7280'; // Cor padrão (cinza) caso o texto esteja vazio
  }

  const firstLetter = text[0].toLowerCase();

  // Mapeamento de cores para cada letra do alfabeto
  const colorMap: Record<string, string> = {
    'a': '#EF4444', // Vermelho
    'b': '#F97316', // Laranja
    'c': '#F59E0B', // Âmbar
    'd': '#EAB308', // Amarelo
    'e': '#84CC16', // Lima
    'f': '#22C55E', // Verde
    'g': '#10B981', // Esmeralda
    'h': '#14B8A6', // Turquesa
    'i': '#06B6D4', // Ciano
    'j': '#0EA5E9', // Azul claro
    'k': '#3B82F6', // Azul
    'l': '#6366F1', // Índigo
    'm': '#8B5CF6', // Violeta
    'n': '#A855F7', // Roxo
    'o': '#C026D3', // Fúcsia
    'p': '#D946EF', // Magenta
    'q': '#EC4899', // Pink
    'r': '#F43F5E', // Rosa
    's': '#FB7185', // Rosa claro
    't': '#F472B6', // Rosa pink
    'u': '#E879F9', // Roxo claro
    'v': '#C084FC', // Violeta claro
    'w': '#A78BFA', // Índigo claro
    'x': '#818CF8', // Azul índigo
    'y': '#60A5FA', // Azul céu
    'z': '#38BDF8', // Azul ciano
  };

  // Retorna a cor correspondente ou uma cor padrão se não for uma letra
  return colorMap[firstLetter] || '#6B7280';
}
