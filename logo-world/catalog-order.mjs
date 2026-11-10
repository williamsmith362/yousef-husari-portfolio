// Keep the curated opening intact and put newly appended trousers before
// the closing bags and small objects. Both browsing views use this order.
export function orderCatalogProjects(pieces) {
  const firstObject = pieces.findIndex(piece => piece.kind === 'small-object');
  if (firstObject < 0) return [...pieces];
  let accessories = firstObject;
  while (accessories > 0 && pieces[accessories - 1].kind === 'bag') accessories--;
  const closing = pieces.slice(accessories);
  return [
    ...pieces.slice(0, accessories),
    ...closing.filter(piece => piece.kind === 'trousers'),
    ...closing.filter(piece => piece.kind !== 'trousers')
  ];
}
