export function photoFrame(image, ratio = .8, preview = false) {
  const b = image.bounds;
  const productRatio = b.width / b.height;
  const frame = document.createElement('span');
  frame.className = 'product-photo';
  frame.style.aspectRatio = ratio;
  const crop = document.createElement('span');
  crop.className = 'cutout-window';
  crop.style.width = (productRatio > ratio ? 91 : 91 * productRatio / ratio) + '%';
  crop.style.height = (productRatio > ratio ? 91 * ratio / productRatio : 91) + '%';
  const img = document.createElement('img');
  img.src = (preview ? '/previews/' : '/pieces/') + image.file + '.webp';
  img.alt = image.alt;
  img.loading = 'lazy';
  img.decoding = 'async';
  img.draggable = false;
  img.style.cssText = 'width:' + b.sourceWidth / b.width * 100 + '%;height:' + b.sourceHeight / b.height * 100 + '%;left:' + -b.x / b.width * 100 + '%;top:' + -b.y / b.height * 100 + '%';
  crop.append(img);
  frame.append(crop);
  return frame;
}

