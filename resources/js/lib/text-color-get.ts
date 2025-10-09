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
    'a': '#ffaeae',
    'b': '#ffb988',
    'c': '#F59E0B',
    'd': '#EAB308',
    'e': '#c1e59a',
    'f': '#22C55E',
    'g': '#10B981',
    'h': '#14B8A6',
    'i': '#06B6D4',
    'j': '#0EA5E9',
    'k': '#3B82F6',
    'l': '#6366F1',
    'm': '#8B5CF6',
    'n': '#A855F7',
    'o': '#C026D3',
    'p': '#D946EF',
    'q': '#EC4899',
    'r': '#F43F5E',
    's': '#FB7185',
    't': '#F472B6',
    'u': '#E879F9',
    'v': '#C084FC',
    'w': '#A78BFA',
    'x': '#818CF8',
    'y': '#60A5FA',
    'z': '#38BDF8',
  };

  // Retorna a cor correspondente ou uma cor padrão se não for uma letra
  return colorMap[firstLetter] || '#6B7280';
}
