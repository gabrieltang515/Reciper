export function cleanTextContent(text = '') {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\w\s\-.,!?()]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 200);
}

export function cleanRecipeTitle(title = '') {
  return cleanTextContent(title).substring(0, 100);
}

export function cleanIngredients(list = []) {
  return list
    .map(item => cleanTextContent(item))
    .filter(t => t.length >= 3 && t.length <= 150)
    .filter((v, i, a) => a.indexOf(v) === i);
}

export function cleanInstructions(list = []) {
  return list
    .map(item => cleanTextContent(item))
    .filter(t => t.length >= 10 && t.length <= 500)
    .filter((v, i, a) => a.indexOf(v) === i);
}
